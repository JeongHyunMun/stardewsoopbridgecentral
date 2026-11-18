
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using StardewModdingAPI;
using StardewModdingAPI.Events;
using StardewValley;
using StardewValley.GameData.Objects;
using StardewValley.Monsters;

namespace SoopStardewBridge
{
    internal sealed class ModEntry : Mod
    {
        private const string ChestItemId = "SoopStardewBridge_RewardChest";
        private const string MailPrefix = "SoopStardewBridge_ChestMail_";
        private const string ChestTextureAsset = "SoopStardewBridge/reward_chest";
        private const int ChestSpriteIndex = 0;
        private const int MaxMailEntries = 10000;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };

        private readonly ConcurrentQueue<DonationEvent> incomingEvents = new();
        private readonly ConcurrentQueue<AdminGrant> incomingAdminGrants = new();
        private readonly HashSet<long> loggedFarmerIds = new();
        private readonly Random random = new();
        private readonly HttpClient centralHttp = new() { Timeout = TimeSpan.FromSeconds(12) };

        private BridgeConfig config = new();
        private LinkStore links = new();
        private BridgeState state = new();

        private HttpListener? listener;
        private CancellationTokenSource? listenerCancellation;
        private CancellationTokenSource? centralCancellation;

        public override void Entry(IModHelper helper)
        {
            config = Helper.ReadConfig<BridgeConfig>();

            if (string.IsNullOrWhiteSpace(config.AuthToken))
            {
                config.AuthToken = Guid.NewGuid().ToString("N");
                Helper.WriteConfig(config);
            }

            links = Helper.Data.ReadJsonFile<LinkStore>("links.json")
                ?? new LinkStore();

            state = Helper.Data.ReadJsonFile<BridgeState>("state.json")
                ?? new BridgeState();

            Helper.Events.GameLoop.SaveLoaded += OnSaveLoaded;
            Helper.Events.GameLoop.DayStarted += OnDayStarted;
            Helper.Events.GameLoop.UpdateTicked += OnUpdateTicked;
            Helper.Events.Input.ButtonPressed += OnButtonPressed;
            Helper.Events.Content.AssetRequested += OnAssetRequested;

            StartHttpListener();
            StartCentralPolling();

            Monitor.Log("SOOP Stardew Bridge가 시작되었습니다.", LogLevel.Info);
            Monitor.Log(
                $"후원 이벤트 수신 주소: http://127.0.0.1:{config.Port}/event",
                LogLevel.Info
            );
            Monitor.Log("계정 연결 정보는 links.json에서 관리합니다.", LogLevel.Info);
            Monitor.Log($"보상 모드: {(config.TestMode ? "테스트(1/2/3개)" : "실제(33/100/1000개)")}", LogLevel.Info);
        }

        // F6 테스트: 현재 플레이어에게 보상 상자 1개를 우편으로 등록합니다.
        private void OnButtonPressed(object? sender, ButtonPressedEventArgs e)
        {
            if (!Context.IsWorldReady || !Context.IsMainPlayer)
                return;

            if (e.Button != SButton.F6)
                return;

            Farmer farmer = Game1.player;
            long farmerId = farmer.UniqueMultiplayerID;

            AddPending(state.PendingChests, farmerId, 1);
            SaveState();

            Monitor.Log(
                $"[F6 테스트] {farmer.Name}에게 보상 상자 1개를 지급 요청했습니다.",
                LogLevel.Info
            );

            ProcessPendingRewards();
        }

        private void OnSaveLoaded(object? sender, SaveLoadedEventArgs e)
        {
            links = Helper.Data.ReadJsonFile<LinkStore>("links.json")
                ?? links;

            state = Helper.Data.ReadJsonFile<BridgeState>("state.json")
                ?? state;

            loggedFarmerIds.Clear();

            SaveState();
            LogOnlineFarmers();
            ProcessPendingRewards();

            Monitor.Log(
                $"처리 이벤트: {state.ProcessedEventIds.Count}, " +
                $"대기 상자 대상: {state.PendingChests.Count}, " +
                $"대기 몬스터 대상: {state.PendingMonsters.Count}",
                LogLevel.Info
            );
        }

        private void OnDayStarted(object? sender, DayStartedEventArgs e)
        {
            ProcessPendingRewards();
        }

        private void OnUpdateTicked(object? sender, UpdateTickedEventArgs e)
        {
            if (!Context.IsWorldReady)
                return;

            // 새로 접속한 플레이어의 캐릭터 ID를 로그에 표시한다.
            if (e.IsMultipleOf(60))
                LogOnlineFarmers();

            // HTTP 스레드에서 받은 이벤트는 게임 스레드에서 처리한다.
            while (incomingEvents.TryDequeue(out DonationEvent? donation))
            {
                if (donation != null)
                    ProcessDonation(donation);
            }

            while (incomingAdminGrants.TryDequeue(out AdminGrant? grant))
            {
                if (grant != null)
                {
                    bool processed = ProcessAdminGrant(grant);
                    if (!string.IsNullOrWhiteSpace(grant.CentralJobId))
                        _ = AcknowledgeCentralJobAsync(grant.CentralJobId, processed);
                }
            }

            if (e.IsMultipleOf(60))
                ProcessPendingRewards();
        }

        private void LogOnlineFarmers()
        {
            foreach (Farmer farmer in Game1.getOnlineFarmers())
            {
                long farmerId = farmer.UniqueMultiplayerID;

                if (!loggedFarmerIds.Add(farmerId))
                    continue;

                Monitor.Log(
                    $"접속 플레이어 확인: Name={farmer.Name}, FarmerId={farmerId}",
                    LogLevel.Info
                );
            }
        }

        private void OnAssetRequested(object? sender, AssetRequestedEventArgs e)
        {
            if (e.NameWithoutLocale.IsEquivalentTo(ChestTextureAsset))
            {
                e.LoadFromModFile<Texture2D>(
                    "assets/reward_chest.png",
                    AssetLoadPriority.Exclusive
                );
                return;
            }

            if (e.NameWithoutLocale.IsEquivalentTo("Data/Objects"))
            {
                e.Edit(asset =>
                {
                    var data = asset.AsDictionary<string, ObjectData>().Data;

                    data[ChestItemId] = new ObjectData
                    {
                        Name = ChestItemId,
                        DisplayName = "SOOP 보상 상자",
                        Description = "SOOP 후원으로 받은 특별한 보상 상자.",
                        Type = "Basic",
                        Category = -8,
                        Price = 0,
                        Texture = ChestTextureAsset,
                        SpriteIndex = ChestSpriteIndex
                    };
                });
                return;
            }

            if (e.NameWithoutLocale.IsEquivalentTo("Data/mail"))
            {
                e.Edit(asset =>
                {
                    var data = asset.AsDictionary<string, string>().Data;

                    for (int i = 1; i <= MaxMailEntries; i++)
                    {
                        string mailId = MailPrefix + i;

                        if (data.ContainsKey(mailId))
                            continue;

                        data[mailId] =
                            "안녕하세요!^^" +
                            "SOOP 후원 보상 상자를 보내드립니다." +
                            "^^후원해 주셔서 감사합니다!" +
                            "%item id (O)" + ChestItemId +
                            " 1 %%[#]SOOP 보상 상자";
                    }
                });
            }
        }

        // Central server connector: outbound polling only; the streamer does not need to expose a game port.
        private void StartCentralPolling()
        {
            if (string.IsNullOrWhiteSpace(config.CentralServerUrl) ||
                string.IsNullOrWhiteSpace(config.AgentToken))
            {
                Monitor.Log("중앙 서버 연결 미설정: config.json의 CentralServerUrl과 AgentToken을 설정하면 관리자 웹페이지 보상을 받을 수 있습니다.", LogLevel.Info);
                return;
            }

            centralCancellation = new CancellationTokenSource();
            _ = CentralPollingLoopAsync(centralCancellation.Token);
            Monitor.Log("중앙 보상 서버 폴링을 시작했습니다.", LogLevel.Info);
        }

        private async Task CentralPollingLoopAsync(CancellationToken cancellationToken)
        {
            string baseUrl = config.CentralServerUrl.TrimEnd('/');
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, baseUrl + "/api/agent/poll");
                    request.Headers.Add("X-Agent-Token", config.AgentToken);
                    request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
                    using HttpResponseMessage response = await centralHttp.SendAsync(request, cancellationToken).ConfigureAwait(false);
                    string json = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                    if (response.IsSuccessStatusCode)
                    {
                        CentralPollResponse? poll = JsonSerializer.Deserialize<CentralPollResponse>(json, JsonOptions);
                        if (poll?.Job != null)
                        {
                            incomingAdminGrants.Enqueue(new AdminGrant
                            {
                                GrantId = poll.Job.Id,
                                CentralJobId = poll.Job.Id,
                                SoopId = poll.Job.SoopId,
                                RewardType = poll.Job.RewardType,
                                Amount = poll.Job.Amount,
                                Reason = poll.Job.Reason
                            });
                        }
                    }
                    else if (response.StatusCode == HttpStatusCode.Unauthorized)
                    {
                        Monitor.Log("중앙 서버 인증 실패: AgentToken 또는 방송 활성 상태를 확인하세요.", LogLevel.Error);
                        await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken).ConfigureAwait(false);
                        continue;
                    }
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Monitor.Log($"중앙 서버 연결 오류(재시도 예정): {ex.Message}", LogLevel.Trace);
                }

                try { await Task.Delay(TimeSpan.FromSeconds(8), cancellationToken).ConfigureAwait(false); }
                catch (OperationCanceledException) { break; }
            }
        }

        private async Task AcknowledgeCentralJobAsync(string jobId, bool processed)
        {
            try
            {
                string baseUrl = config.CentralServerUrl.TrimEnd('/');
                using var request = new HttpRequestMessage(HttpMethod.Post, baseUrl + "/api/agent/ack");
                request.Headers.Add("X-Agent-Token", config.AgentToken);
                request.Content = new StringContent(JsonSerializer.Serialize(new
                {
                    jobId,
                    status = processed ? "COMPLETED" : "REVIEW",
                    message = processed ? "SMAPI가 보상 요청을 게임 스레드에서 처리했습니다." : "SMAPI에서 대상 계정/지급 처리를 확인하지 못했습니다."
                }), Encoding.UTF8, "application/json");
                using HttpResponseMessage response = await centralHttp.SendAsync(request).ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                    Monitor.Log($"중앙 서버 지급 확인 전송 실패: job={jobId}, HTTP={(int)response.StatusCode}", LogLevel.Warn);
            }
            catch (Exception ex)
            {
                Monitor.Log($"중앙 서버 지급 확인 전송 오류: job={jobId}, {ex.Message}", LogLevel.Warn);
            }
        }

        private void StartHttpListener()
        {
            if (config.Port < 1 || config.Port > 65535)
            {
                Monitor.Log("config.json의 Port 값이 잘못되었습니다.", LogLevel.Error);
                return;
            }

            listenerCancellation = new CancellationTokenSource();
            listener = new HttpListener();

            listener.Prefixes.Add($"http://+:{config.Port}/");

            try
            {
                listener.Start();
                _ = ListenLoopAsync(listener, listenerCancellation.Token);
            }
            catch (Exception ex)
            {
                Monitor.Log($"HTTP 수신부 시작 실패: {ex}", LogLevel.Error);
                listener.Close();
                listener = null;
            }
        }

        private async Task ListenLoopAsync(
            HttpListener httpListener,
            CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested &&
                   httpListener.IsListening)
            {
                HttpListenerContext context;

                try
                {
                    context = await httpListener.GetContextAsync()
                        .ConfigureAwait(false);
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Monitor.Log($"HTTP 수신 오류: {ex.Message}", LogLevel.Warn);
                    continue;
                }

                _ = HandleHttpRequestAsync(context);
            }
        }

        private async Task HandleHttpRequestAsync(HttpListenerContext context)
        {
            try
            {
                HttpListenerRequest request = context.Request;
                HttpListenerResponse response = context.Response;

                if (!string.Equals(request.HttpMethod, "POST",
                    StringComparison.OrdinalIgnoreCase))
                {
                    await WriteResponseAsync(response, 405,
                        "{\"error\":\"POST required\"}");
                    return;
                }

                string requestPath = request.Url?.AbsolutePath ?? "";
                bool isDonationRequest = string.Equals(requestPath, "/event", StringComparison.OrdinalIgnoreCase);
                bool isAdminGrantRequest = string.Equals(requestPath, "/admin/grant", StringComparison.OrdinalIgnoreCase);
                if (!isDonationRequest && !isAdminGrantRequest)
                {
                    await WriteResponseAsync(response, 404,
                        "{\"error\":\"not found\"}");
                    return;
                }

                string suppliedToken = request.Headers["X-SOOP-Token"] ?? "";

                if (!FixedTimeEquals(suppliedToken, config.AuthToken))
                {
                    await WriteResponseAsync(response, 401,
                        "{\"error\":\"unauthorized\"}");
                    return;
                }

                if (request.ContentLength64 > 64 * 1024)
                {
                    await WriteResponseAsync(response, 413,
                        "{\"error\":\"payload too large\"}");
                    return;
                }

                string body;

                using (var reader = new StreamReader(
                    request.InputStream,
                    request.ContentEncoding))
                {
                    body = await reader.ReadToEndAsync().ConfigureAwait(false);
                }

                if (isAdminGrantRequest)
                {
                    AdminGrant? grant;
                    try
                    {
                        grant = JsonSerializer.Deserialize<AdminGrant>(body, JsonOptions);
                    }
                    catch (JsonException)
                    {
                        await WriteResponseAsync(response, 400, "{\"error\":\"invalid json\"}");
                        return;
                    }

                    if (grant == null || string.IsNullOrWhiteSpace(grant.GrantId) ||
                        string.IsNullOrWhiteSpace(grant.SoopId) ||
                        (grant.RewardType != "chest" && grant.RewardType != "monster") ||
                        grant.Amount < 1 || grant.Amount > 1000)
                    {
                        await WriteResponseAsync(response, 400,
                            "{\"error\":\"grantId, soopId, rewardType(chest|monster), amount(1..1000) required\"}");
                        return;
                    }

                    incomingAdminGrants.Enqueue(grant);
                    await WriteResponseAsync(response, 202,
                        "{\"accepted\":true,\"message\":\"admin grant queued\"}");
                    return;
                }

                DonationEvent? donation;

                try
                {
                    donation = JsonSerializer.Deserialize<DonationEvent>(
                        body, JsonOptions);
                }
                catch (JsonException)
                {
                    await WriteResponseAsync(response, 400,
                        "{\"error\":\"invalid json\"}");
                    return;
                }

                if (donation == null ||
                    string.IsNullOrWhiteSpace(donation.EventId) ||
                    string.IsNullOrWhiteSpace(donation.SoopId) ||
                    donation.Balloons <= 0)
                {
                    await WriteResponseAsync(response, 400,
                        "{\"error\":\"eventId, soopId and positive balloons are required\"}");
                    return;
                }

                incomingEvents.Enqueue(donation);

                await WriteResponseAsync(response, 202,
                    "{\"accepted\":true,\"message\":\"queued for game-thread processing\"}");
            }
            catch (Exception ex)
            {
                Monitor.Log($"HTTP 요청 처리 오류: {ex.Message}", LogLevel.Warn);

                try
                {
                    await WriteResponseAsync(context.Response, 500,
                        "{\"error\":\"internal error\"}");
                }
                catch
                {
                    // 응답 연결이 이미 종료된 경우 무시한다.
                }
            }
        }

        private static async Task WriteResponseAsync(
            HttpListenerResponse response,
            int statusCode,
            string content)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(content);

            response.StatusCode = statusCode;
            response.ContentType = "application/json; charset=utf-8";
            response.ContentLength64 = bytes.Length;

            await response.OutputStream.WriteAsync(bytes, 0, bytes.Length)
                .ConfigureAwait(false);

            response.Close();
        }

        private static bool FixedTimeEquals(string a, string b)
        {
            if (a.Length != b.Length)
                return false;

            int difference = 0;

            for (int i = 0; i < a.Length; i++)
                difference |= a[i] ^ b[i];

            return difference == 0;
        }

        private void ProcessDonation(DonationEvent donation)
        {
            string eventId = donation.EventId.Trim();
            string soopId = donation.SoopId.Trim();

            // 이미 처리한 이벤트는 다시 보상을 지급하지 않는다.
            if (state.ProcessedEventIds.Contains(eventId))
            {
                Monitor.Log($"중복 이벤트 무시: {eventId}", LogLevel.Warn);
                return;
            }

            // 등록되어 있고, 스트리머 인증 및 관리자 승인이 끝난 계정만 허용한다.
            StreamerLink? link = links.Streamers.FirstOrDefault(x =>
                string.Equals(x.SoopId, soopId, StringComparison.OrdinalIgnoreCase));

            if (link == null || !link.AdminApproved || !link.StreamerVerified)
            {
                Monitor.Log(
                    $"연결 또는 인증이 완료되지 않은 계정의 이벤트를 거부했습니다: {soopId}",
                    LogLevel.Warn);
                return;
            }

            if (donation.Balloons <= 0)
            {
                Monitor.Log($"잘못된 후원 수량: SOOP={soopId}, 별풍선={donation.Balloons}", LogLevel.Warn);
                return;
            }

            int balloons = donation.Balloons;
            int chestCount = 0;
            int monsterCount = 0;

            if (config.TestMode)
            {
                // 테스트 모드: 테스트용 소액 기준만 적용한다.
                // 1개=몬스터 1마리, 2개=상자 1개, 3개=상자 11개.
                if (balloons == 1) monsterCount = 1;
                else if (balloons == 2) chestCount = 1;
                else if (balloons == 3) chestCount = 11;
            }
            else
            {
                // 실제 모드: 33개=몬스터 1마리.
                // 상자: 100~999개는 100개당 1개, 정확히 1,000개는 11개.
                if (balloons >= 33)
                    monsterCount = 1;

                if (balloons == 1000)
                    chestCount = 11;
                else if (balloons >= 100 && balloons < 1000)
                    chestCount = balloons / 100;
            }

            // 33개 미만은 보상 기준 미달이지만, 중복으로 재처리되지 않도록 기록한다.
            if (chestCount == 0 && monsterCount == 0)
            {
                RememberEvent(eventId);
                Monitor.Log(
                    $"보상 기준 미달: SOOP={soopId}, 별풍선={balloons}",
                    LogLevel.Info);
                return;
            }

            if (chestCount > 0)
                AddPending(state.PendingChests, link.FarmerId, chestCount);

            if (monsterCount > 0)
                AddPending(state.PendingMonsters, link.FarmerId, monsterCount);

            // 대기 보상과 이벤트 ID를 함께 저장해 중복 지급 위험을 줄인다.
            // RememberEvent 내부에서 SaveState를 호출한다.
            RememberEvent(eventId);

            Monitor.Log(
                $"후원 이벤트 접수: ID={eventId}, SOOP={soopId}, 별풍선={balloons}, " +
                $"상자={chestCount}, 몬스터={monsterCount}, FarmerId={link.FarmerId}",
                LogLevel.Info);

            ProcessPendingRewards();
        }

        private bool ProcessAdminGrant(AdminGrant grant)
        {
            string grantId = "admin:" + grant.GrantId.Trim();
            string soopId = grant.SoopId.Trim();

            if (state.ProcessedEventIds.Contains(grantId))
            {
                Monitor.Log($"관리자 지급 중복 요청 무시: {grantId}", LogLevel.Warn);
                return true;
            }

            StreamerLink? link = links.Streamers.FirstOrDefault(x =>
                string.Equals(x.SoopId, soopId, StringComparison.OrdinalIgnoreCase));

            if (link == null || !link.AdminApproved || !link.StreamerVerified)
            {
                Monitor.Log($"관리자 수동 지급 실패: 연결/승인된 SOOP 계정이 아닙니다: {soopId}", LogLevel.Warn);
                return false;
            }

            if (grant.RewardType == "chest")
                AddPending(state.PendingChests, link.FarmerId, grant.Amount);
            else
                AddPending(state.PendingMonsters, link.FarmerId, grant.Amount);

            RememberEvent(grantId);
            Monitor.Log(
                $"관리자 수동 지급 접수: SOOP={soopId}, 종류={grant.RewardType}, 수량={grant.Amount}, FarmerId={link.FarmerId}, 사유={grant.Reason}",
                LogLevel.Info);
            ProcessPendingRewards();
            return true;
        }

        private void RememberEvent(string eventId)
        {
            state.ProcessedEventIds.Add(eventId);

            while (state.ProcessedEventIds.Count > 50000)
                state.ProcessedEventIds.RemoveAt(0);

            SaveState();
        }

        private static void AddPending(
            Dictionary<long, int> dictionary,
            long farmerId,
            int count)
        {
            if (count <= 0)
                return;

            dictionary.TryGetValue(farmerId, out int existing);
            dictionary[farmerId] = existing + count;
        }

        private void ProcessPendingRewards()
        {
            if (!Context.IsWorldReady)
                return;

            foreach (var entry in state.PendingChests.ToArray())
            {
                long farmerId = entry.Key;
                int pending = entry.Value;

                if (pending <= 0)
                {
                    state.PendingChests.Remove(farmerId);
                    continue;
                }

                Farmer? farmer = FindOnlineFarmer(farmerId);

                if (farmer == null)
                    continue;

                int sent = 0;

                while (sent < pending &&
                       state.NextMailNumber < MaxMailEntries)
                {
                    int nextNumber = state.NextMailNumber + 1;
                    string mailId = MailPrefix + nextNumber;
                    state.NextMailNumber = nextNumber;

                    if (farmer.hasOrWillReceiveMail(mailId))
                        continue;

                    farmer.mailbox.Add(mailId);
                    sent++;

                    state.PendingChests[farmerId] = pending - sent;
                    SaveState();
                }

                int remaining = pending - sent;

                if (remaining <= 0)
                    state.PendingChests.Remove(farmerId);
                else
                    state.PendingChests[farmerId] = remaining;

                if (sent > 0)
                {
                    Monitor.Log(
                        $"보상 우편 등록: FarmerId={farmerId}, 수량={sent}",
                        LogLevel.Info
                    );
                }

                if (remaining > 0 &&
                    state.NextMailNumber >= MaxMailEntries)
                {
                    Monitor.Log(
                        "편지 ID 한도에 도달했습니다. 남은 보상은 대기 상태입니다.",
                        LogLevel.Warn
                    );
                }
            }

            foreach (var entry in state.PendingMonsters.ToArray())
            {
                long farmerId = entry.Key;
                int pending = entry.Value;

                if (pending <= 0)
                {
                    state.PendingMonsters.Remove(farmerId);
                    continue;
                }

                Farmer? farmer = FindOnlineFarmer(farmerId);

                if (farmer?.currentLocation == null)
                    continue;

                int spawned = 0;

                while (spawned < pending)
                {
                    Vector2 tile = farmer.Tile;
                    Vector2 spawnTile = new(
                        tile.X + random.Next(-3, 4),
                        tile.Y + random.Next(-3, 4)
                    );

                    farmer.currentLocation.characters.Add(
                        new GreenSlime(spawnTile * 64f)
                    );

                    spawned++;
                }

                state.PendingMonsters.Remove(farmerId);

                Monitor.Log(
                    $"몬스터 소환 완료: FarmerId={farmerId}, 수량={spawned}",
                    LogLevel.Info
                );
            }

            SaveState();
        }

        private static Farmer? FindOnlineFarmer(long farmerId)
        {
            return Game1.getOnlineFarmers()
                .FirstOrDefault(f => f.UniqueMultiplayerID == farmerId);
        }

        private void SaveState()
        {
            Helper.Data.WriteJsonFile("state.json", state);
        }

        private sealed class BridgeConfig
        {
            public int Port { get; set; } = 8765;
            public string AuthToken { get; set; } = "";
            public string CentralServerUrl { get; set; } = "";
            public string AgentToken { get; set; } = "";
            // true=테스트 기준(1/2/3개), false=실제 기준(33/100/1000개)
            public bool TestMode { get; set; } = true;
        }

        private sealed class LinkStore
        {
            public List<StreamerLink> Streamers { get; set; } = new();
        }

        private sealed class StreamerLink
        {
            public string SoopId { get; set; } = "";
            public long FarmerId { get; set; }
            public bool AdminApproved { get; set; }
            public bool StreamerVerified { get; set; }
        }

        private sealed class DonationEvent
        {
            public string EventId { get; set; } = "";
            public string SoopId { get; set; } = "";
            public int Balloons { get; set; }
        }

        private sealed class AdminGrant
        {
            public string GrantId { get; set; } = "";
            public string CentralJobId { get; set; } = "";
            public string SoopId { get; set; } = "";
            public string RewardType { get; set; } = "";
            public int Amount { get; set; }
            public string Reason { get; set; } = "관리자 수동 지급";
        }

        private sealed class CentralPollResponse
        {
            public bool Ok { get; set; }
            public CentralJob? Job { get; set; }
        }

        private sealed class CentralJob
        {
            public string Id { get; set; } = "";
            public string SoopId { get; set; } = "";
            public string FarmerName { get; set; } = "";
            public string RewardType { get; set; } = "";
            public int Amount { get; set; }
            public string Reason { get; set; } = "";
        }

        private sealed class BridgeState
        {
            public List<string> ProcessedEventIds { get; set; } = new();
            public Dictionary<long, int> PendingChests { get; set; } = new();
            public Dictionary<long, int> PendingMonsters { get; set; } = new();
            public int NextMailNumber { get; set; }
        }
    }
}

