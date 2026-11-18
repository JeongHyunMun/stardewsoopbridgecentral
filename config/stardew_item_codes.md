# 스타듀밸리 1.6 아이템 코드 (Player_add)

## 사용법

```
Player_add (타입)아이템코드 [개수] [품질]
```

예) 이리듐 등급 파스닙 5개 → `Player_add (O)24 5 4`

### 타입 접두어

| 접두어 | 타입 | 한글 |
|---|---|---|
| O | Object | 물건 |
| BC | BigCraftable | 제작품 |
| T | Tool | 도구 |
| W | Weapon | 무기 |
| H | Hat | 모자 |
| B | Boots | 신발 |
| S | Shirt | 상의 |
| P | Pants | 하의 |
| M | Mannequin | 마네킹 |
| TR | Trinkets | 장신구 |
| F | Furniture | 가구 |
| WP | Wallpaper | 벽지 |
| FL | Flooring | 바닥재 |

모자/신발/상의/하의/마네킹/장신구/가구/벽지/바닥재 코드는 이 문서에 없음 (출처: bobaenni.tistory.com 별도 글).

### 품질 코드

| 품질 | 코드 |
|---|---|
| 기본 | (생략) |
| 은 | 1 |
| 금 | 2 |
| 이리듐 | 4 |

### 가공품 코드 규칙 (`가공품ID/원재료ID`)

| 가공품 | 형식 | 예시 |
|---|---|---|
| 과일 젤리 | `344/과일ID` | 고대 과일 젤리 `344/454` |
| 채소 절임 | `342/채소ID` | 가지 절임 `342/272` |
| 꽃 벌꿀 | `340/꽃ID` | 스위트피 벌꿀 `340/402` |
| 말린 과일 | `398/과일ID` | 말린 오렌지 `398/635` |
| 말린 버섯 | `DriedMushrooms/버섯ID` | 말린 보라색 버섯 `DriedMushrooms/422` |
| 과일 와인 | `348/과일ID` | 고대 과일 와인 `348/454` |
| 채소 주스 | `350/채소ID` | 가지 주스 `350/272` |
| 물고기 어란 | `812/물고기ID` | 가오리 어란 `812/836` |
| 숙성된 어란 | `447/물고기ID` | 숙성된 가오리 어란 `447/836` (철갑상어 제외) |
| 훈제 생선 | `SmokedFish/물고기ID` | 훈제 가오리 `SmokedFish/836` |
| 특정 미끼 | `SpecificBait/물고기ID` | 게 미끼 `SpecificBait/717` |
| 비밀 노트 | `79/1`~`79/27` | |
| 일지 조각 | `842/1`~`842/11` | |

---

# 1. 물건 (O)

## 장식 / 울타리

| 한글 | English | ID |
|---|---|---|
| 나무 바닥 | Wood Floor | 328 |
| 오래된 바닥 | Weathered Floor | 331 |
| 짚 바닥 | Straw Floor | 401 |
| 돌길 바닥 | Stone Walkway Floor | 841 |
| 돌 바닥 | Stone Floor | 329 |
| 소박한 판자 바닥 | Rustic Plank Floor | 840 |
| 수정 바닥 | Crystal Floor | 333 |
| 벽돌 바닥 | Brick Floor | 293 |
| 나무 길 | Wood Path | 405 |
| 나무 울타리 | Wood Fence | 322 |
| 디딤돌 길 | Stepping Stone Path | 415 |
| 돌 울타리 | Stone Fence | 323 |
| 자갈 길 | Gravel Path | 407 |
| 철 울타리 | Iron Fence | 324 |
| 수정 길 | Crystal Path | 409 |
| 단단한 나무 울타리 | Hardwood Fence | 298 |
| 조약돌 길 | Cobblestone Path | 411 |
| 울타리 문 | Gate | 325 |

## 씨앗 / 작물 / 채집물

| 한글 | English | ID |
|---|---|---|
| 리크 | Leek | 20 |
| 민들레 | Dandelion | 22 |
| 야생 고추냉이 | Wild Horseradish | 16 |
| 수선화 | Daffodil | 18 |
| 새먼베리 | Salmonberry | 296 |
| 파 | Spring Onion | 399 |
| 콩 종자 | Bean Starter | 473 |
| 완두콩 | Green Bean | 188 |
| 쌀 새싹 | Rice Shoot | 273 |
| 가공되지 않은 쌀 | Unmilled Rice | 271 |
| 감자 씨앗 | Potato Seeds | 475 |
| 감자 | Potato | 192 |
| 당근 씨앗 | Carrot Seeds | CarrotSeeds |
| 당근 | Carrot | Carrot |
| 대황 씨앗 | Rhubarb Seeds | 478 |
| 대황 | Rhubarb | 252 |
| 딸기 씨앗 | Strawberry Seeds | 745 |
| 딸기 | Strawberry | 400 |
| 마늘 씨앗 | Garlic Seeds | 476 |
| 마늘 | Garlic | 248 |
| 재즈 씨앗 | Jazz Seeds | 429 |
| 푸른 재즈 | Blue Jazz | 597 |
| 케일 씨앗 | Kale Seeds | 477 |
| 케일 | Kale | 250 |
| 콜리플라워 씨앗 | Cauliflower Seeds | 474 |
| 콜리플라워 | Cauliflower | 190 |
| 튤립 구근 | Tulip Bulb | 427 |
| 튤립 | Tulip | 591 |
| 파스닙 씨앗 | Parsnip Seeds | 472 |
| 파스닙 | Parsnip | 24 |
| 커피콩 | Coffee Bean | 433 |
| 스위트피 | Sweet Pea | 402 |
| 백량금 | Spice Berry | 396 |
| 청나래고사리 | Fiddlehead Fern | 259 |
| 홉 종자 | Hops Starter | 302 |
| 홉 | Hops | 304 |
| 멜론 씨앗 | Melon Seeds | 479 |
| 멜론 | Melon | 254 |
| 무 씨앗 | Radish Seeds | 484 |
| 무 | Radish | 264 |
| 붉은 양배추 씨앗 | Red Cabbage Seeds | 485 |
| 붉은 양배추 | Red Cabbage | 266 |
| 블루베리 씨앗 | Blueberry Seeds | 481 |
| 블루베리 | Blueberry | 258 |
| 스타프루트 씨앗 | Starfruit Seeds | 486 |
| 스타프루트 | Starfruit | 268 |
| 양귀비 씨앗 | Poppy Seeds | 453 |
| 양귀비 | Poppy | 376 |
| 여름 호박 씨앗 | Summer Squash Seeds | SummerSquashSeeds |
| 여름 호박 | Summer Squash | SummerSquash |
| 여름별꽃 씨앗 | Spangle Seeds | 455 |
| 여름별꽃 | Summer Spangle | 593 |
| 토란 줄기 | Taro Tuber | 831 |
| 토란 | Taro Root | 830 |
| 토마토 씨앗 | Tomato Seeds | 480 |
| 토마토 | Tomato | 256 |
| 파인애플 씨앗 | Pineapple Seeds | 833 |
| 파인애플 | Pineapple | 832 |
| 고추 씨앗 | Pepper Seeds | 482 |
| 매운 고추 | Hot Pepper | 260 |
| 밀 씨앗 | Wheat Seeds | 483 |
| 밀 | Wheat | 262 |
| 옥수수 씨앗 | Corn Seeds | 487 |
| 옥수수 | Corn | 270 |
| 해바라기 씨앗 | Sunflower Seeds | 431 |
| 해바라기 | Sunflower | 421 |
| 야생 자두 | Wild Plum | 406 |
| 생강 | Ginger | 829 |
| 헤이즐넛 | Hazelnut | 408 |
| 블랙베리 | Blackberry | 410 |
| 포도 종자 | Grape Starter | 301 |
| 포도 | Grape | 398 |
| 가지 씨앗 | Eggplant Seeds | 488 |
| 가지 | Eggplant | 272 |
| 브로콜리 씨앗 | Broccoli Seeds | BroccoliSeeds |
| 브로콜리 | Broccoli | Broccoli |
| 사탕무 씨앗 | Beet Seeds | 494 |
| 사탕무 | Beet | 284 |
| 아마란스 씨앗 | Amaranth Seeds | 299 |
| 아마란스 | Amaranth | 300 |
| 아티초크 씨앗 | Artichoke Seeds | 489 |
| 아티초크 | Artichoke | 274 |
| 요정 장미 씨앗 | Fairy Seeds | 425 |
| 요정 장미 | Fairy Rose | 595 |
| 참마 씨앗 | Yam Seeds | 492 |
| 참마 | Yam | 280 |
| 청경채 씨앗 | Bok Choy Seeds | 491 |
| 청경채 | Bok Choy | 278 |
| 크랜베리 씨앗 | Cranberry Seeds | 493 |
| 크랜베리 | Cranberries | 282 |
| 호박 씨앗 | Pumpkin Seeds | 490 |
| 호박 | Pumpkin | 276 |
| 희귀한 씨앗 | Rare Seed | 347 |
| 달콤보석베리 | Sweet Gem Berry | 417 |
| 동굴 당근 | Cave Carrot | 78 |
| 수정 과일 | Crystal Fruit | 414 |
| 겨울뿌리 | Winter Root | 412 |
| 눈마 | Snow Yam | 416 |
| 호랑가시나무 열매 | Holly | 283 |
| 크로커스 | Crocus | 418 |
| 파우더멜론 씨앗 | Powdermelon Seeds | PowdermelonSeeds |
| 파우더멜론 | Powdermelon | Powdermelon |
| 봄 씨앗 모음 | Spring Seeds | 495 |
| 씨앗 모음 | Mixed Seeds | 770 |
| 여름 씨앗 모음 | Summer Seeds | 496 |
| 꽃 씨앗 모음 | Mixed Flower Seeds | MixedFlowerSeeds |
| 가을 씨앗 모음 | Fall Seeds | 497 |
| 섬유 씨앗 | Fiber Seeds | 885 |
| 겨울 씨앗 모음 | Winter Seeds | 498 |
| 코코넛 | Coconut | 88 |
| 선인장 씨앗 | Cactus Seeds | 802 |
| 선인장 열매 | Cactus Fruit | 90 |
| 고대 씨앗 | Ancient Seeds | 499 |
| 고대 과일 | Ancient Fruit | 454 |
| 치 콩 | Qi Bean | 890 |
| 치 열매 | Qi Fruit | 889 |

## 나무 씨앗 / 묘목 / 채집물

| 한글 | English | ID |
|---|---|---|
| 도토리 | Acorn | 309 |
| 참나무 수지 | Oak Resin | 725 |
| 단풍 씨앗 | Maple Seed | 310 |
| 메이플 시럽 | Maple Syrup | 724 |
| 솔방울 | Pine Cone | 311 |
| 소나무 타르 | Pine Tar | 726 |
| 마호가니 씨앗 | Mahogany Seed | 292 |
| 수액 | Sap | 92 |
| 버섯나무 씨앗 | Mushroom Tree Seed | 891 |
| 흔한 버섯 | Common Mushroom | 404 |
| 곰보버섯 | Morel | 257 |
| 살구버섯 | Chanterelle | 281 |
| 붉은 버섯 | Red Mushroom | 420 |
| 보라색 버섯 | Purple Mushroom | 422 |
| 마그마 버섯 | Magma Cap | 851 |
| 건포도 | Raisins | Raisins |
| 살구나무 묘목 | Apricot Sapling | 629 |
| 살구 | Apricot | 634 |
| 체리나무 묘목 | Cherry Sapling | 628 |
| 체리 | Cherry | 638 |
| 복숭아나무 묘목 | Peach Sapling | 631 |
| 복숭아 | Peach | 636 |
| 오렌지나무 묘목 | Orange Sapling | 630 |
| 오렌지 | Orange | 635 |
| 망고 묘목 | Mango Sapling | 835 |
| 망고 | Mango | 834 |
| 바나나 나무 묘목 | Banana Sapling | 69 |
| 바나나 | Banana | 91 |
| 사과나무 묘목 | Apple Sapling | 633 |
| 사과 | Apple | 613 |
| 석류나무 묘목 | Pomegranate Sapling | 632 |
| 석류 | Pomegranate | 637 |
| 신비한 나무 씨앗 | Mystic Tree Seed | MysticTreeSeed |
| 신비한 시럽 | Mystic Syrup | MysticSyrup |
| 이끼 덮인 씨앗 | Mossy Seed | MossySeed |
| 이끼 | Moss | Moss |
| 차나무 묘목 | Tea Sapling | 251 |
| 찻잎 | Tea Leaves | 815 |

## 비료 / 스프링클러

| 한글 | English | ID |
|---|---|---|
| 기본 비료 | Basic Fertilizer | 368 |
| 성장 촉진제 | Speed-Gro | 465 |
| 고급 비료 | Quality Fertilizer | 369 |
| 디럭스 성장 촉진제 | Deluxe Speed-Gro | 466 |
| 디럭스 비료 | Deluxe Fertilizer | 919 |
| 하이퍼 성장 촉진제 | Hyper Speed-Gro | 918 |
| 기본 보습 토양 | Basic Retaining Soil | 370 |
| 스프링클러 | Sprinkler | 599 |
| 고급 보습 토양 | Quality Retaining Soil | 371 |
| 고급 스프링클러 | Quality Sprinkler | 621 |
| 디럭스 보습 토양 | Deluxe Retaining Soil | 920 |
| 이리듐 스프링클러 | Iridium Sprinkler | 645 |
| 나무용 비료 | Tree Fertilizer | 805 |
| 고압 노즐 | Pressure Nozzle | 915 |
| 비료 분사기 | Enricher | 913 |

## 젤리 / 피클 / 벌꿀 / 말린 과일 / 말린 버섯

| 한글 | English | ID |
|---|---|---|
| 젤리 | Jelly | 344 |
| 고대 과일 젤리 | Ancient Fruit Jelly | 344/454 |
| 피클 | Pickles | 342 |
| 가지 절임 | Pickled Eggplant | 342/272 |
| 야생 벌꿀 | Wild Honey | 340 |
| 스위트피 벌꿀 | Sweet Pea Honey | 340/402 |
| 말린 과일 | Dried Fruit | DriedFruit |
| 말린 오렌지 | Dried Orange | 398/635 |
| 말린 버섯 | Dried Mushrooms | DriedMushrooms |
| 말린 보라색 버섯 | Dried Purple Mushroom | DriedMushrooms/422 |

## 주류 / 주스 / 커피 / 차

| 한글 | English | ID |
|---|---|---|
| 페일 에일 | Pale Ale | 303 |
| 맥주 | Beer | 346 |
| 벌꿀 술 | Mead | 459 |
| 와인 | Wine | 348 |
| 고대 과일 와인 | Ancient Fruit Wine | 348/454 |
| 주스 | Juice | 350 |
| 가지 주스 | Eggplant Juice | 350/272 |
| 커피 | Coffee | 395 |
| 트리플 샷 에스프레소 | Triple Shot Espresso | 253 |
| 녹차 | Green Tea | 614 |
| 별방울차 | Stardrop Tea | StardropTea |

## 기본 자원

| 한글 | English | ID |
|---|---|---|
| 나무 | Wood | 388 |
| 단단한 나무 | Hardwood | 709 |
| 돌 | Stone | 390 |
| 배터리 팩 | Battery Pack | 787 |
| 뼛조각 | Bone Fragment | 881 |
| 석탄 | Coal | 382 |
| 섬유 | Fiber | 771 |
| 잉걸불 파편 | Cinder Shard | 848 |
| 점토 | Clay | 330 |

## 몬스터 전리품

| 한글 | English | ID |
|---|---|---|
| 태양 정수 | Solar Essence | 768 |
| 공허 정수 | Void Essence | 769 |
| 박쥐 날개 | Bat Wing | 767 |
| 벌레 고기 | Bug Meat | 684 |
| 슬라임 | Slime | 766 |
| 초록 슬라임 알 | Green Slime Egg | 680 |
| 푸른 슬라임 알 | Blue Slime Egg | 413 |
| 붉은 슬라임 알 | Red Slime Egg | 437 |
| 보라색 슬라임 알 | Purple Slime Egg | 439 |
| 호랑 슬라임 알 | Tiger Slime Egg | 857 |

## 제작 / 의약 용품

| 한글 | English | ID |
|---|---|---|
| 마늘즙 | Oil of Garlic | 772 |
| 생명의 영약 | Life Elixir | 773 |
| 수제 에너지바 | Field Snack | 403 |
| 벌레 스테이크 | Bug Steak | 874 |
| 근육 치료제 | Muscle Remedy | 351 |
| 자양강장제 | Energy Tonic | 349 |

## 닭장 / 외양간 생산품 / 건초 / 잔디 / 황금 동물 과자

| 한글 | English | ID |
|---|---|---|
| 달걀(흰색) | Egg | 176 |
| 큰 달걀(흰색) | Large Egg | 174 |
| 달걀(갈색) | Egg | 180 |
| 큰 달걀(갈색) | Large Egg | 182 |
| 타조알 | Ostrich Egg | 289 |
| 황금 알 | Golden Egg | 928 |
| 마요네즈 | Mayonnaise | 306 |
| 오리알 | Duck Egg | 442 |
| 오리 마요네즈 | Duck Mayonnaise | 307 |
| 오리깃털 | Duck Feather | 444 |
| 공허의 달걀 | Void Egg | 305 |
| 공허 마요네즈 | Void Mayonnaise | 308 |
| 공룡알 | Dinosaur Egg | 107 |
| 공룡 마요네즈 | Dinosaur Mayonnaise | 807 |
| 토끼발 | Rabbit's Foot | 446 |
| 우유 | Milk | 184 |
| 큰 우유 | Large Milk | 186 |
| 치즈 | Cheese | 424 |
| 염소젖 | Goat Milk | 436 |
| 큰 염소젖 | Large Goat Milk | 438 |
| 염소 치즈 | Goat Cheese | 426 |
| 양털 | Wool | 440 |
| 옷감 | Cloth | 428 |
| 송로버섯 | Truffle | 430 |
| 송로버섯 오일 | Truffle Oil | 432 |
| 건초 | Hay | 178 |
| 번식용 잔디 | Grass Starter | 297 |
| 번식용 파란 잔디 | Blue Grass Starter | BlueGrassStarter |
| 황금 동물 과자 | Golden Animal Cracker | GoldenAnimalCracker |

## 광석 / 주괴

| 한글 | English | ID |
|---|---|---|
| 구리광석 | Copper Ore | 378 |
| 구리 주괴 | Copper Bar | 334 |
| 철광석 | Iron Ore | 380 |
| 철 주괴 | Iron Bar | 335 |
| 금광석 | Gold Ore | 384 |
| 금 주괴 | Gold Bar | 336 |
| 이리듐광석 | Iridium Ore | 386 |
| 이리듐 주괴 | Iridium Bar | 337 |
| 방사능 광석 | Radioactive Ore | 909 |
| 방사능 주괴 | Radioactive Bar | 910 |
| 석영 | Quartz | 80 |
| 정제된 석영 | Refined Quartz | 338 |
| 불의 석영 | Fire Quartz | 82 |

## 보석 / 광물

| 한글 | English | ID |
|---|---|---|
| 공작석 | Malachite | 552 |
| 남정석 | Kyanite | 550 |
| 네코아이트 | Nekoite | 555 |
| 넵튜나이트 | Neptunite | 553 |
| 다이아몬드 | Diamond | 72 |
| 대리석 | Marble | 567 |
| 동석 | Soapstone | 572 |
| 둥근 옥수 | Thunder Egg | 558 |
| 땅의 수정 | Earth Crystal | 86 |
| 레몬 스톤 | Lemon Stone | 554 |
| 루나라이트 | Lunarite | 551 |
| 루비 | Ruby | 64 |
| 무지갯빛 파편 | Prismatic Shard | 74 |
| 바다수정 | Ocean Stone | 560 |
| 방해석 | Calcite | 542 |
| 백운석 | Dolomite | 543 |
| 벽옥 | Jasper | 563 |
| 별조각 | Star Shards | 578 |
| 빅사이트 | Bixite | 539 |
| 사암 | Sandstone | 568 |
| 석웅황 | Orpiment | 556 |
| 석화된 슬라임 | Petrified Slime | 557 |
| 석회석 | Limestone | 571 |
| 아쿠아마린 | Aquamarine | 62 |
| 알라마이트 | Alamite | 538 |
| 얼어붙은 눈물 | Frozen Tear | 84 |
| 에메랄드 | Emerald | 60 |
| 에스퍼라이트 | Esperite | 544 |
| 에어리나이트 | Aerinite | 541 |
| 오팔 | Opal | 564 |
| 옥 | Jade | 70 |
| 요정석 | Fairy Stone | 577 |
| 용의 이빨 | Dragon Tooth | 852 |
| 유령수정 | Ghost Crystal | 561 |
| 이암 | Mudstone | 574 |
| 자수정 | Amethyst | 66 |
| 잠보라이트 | Jamborite | 548 |
| 재고아이트 | Jagoite | 549 |
| 적철석 | Hematite | 573 |
| 점판암 | Slate | 576 |
| 제미나이트 | Geminite | 546 |
| 중정석 | Baryte | 540 |
| 진주 | Pearl | 797 |
| 천청석 | Celestine | 566 |
| 토파즈 | Topaz | 68 |
| 플루오르 인회석 | Fluorapatite | 545 |
| 헬바이트 | Helvite | 547 |
| 현무암 | Basalt | 570 |
| 호안석 | Tigerseye | 562 |
| 화강암 | Granite | 569 |
| 화단백석 | Fire Opal | 565 |
| 황금 호박 | Golden Pumpkin | 373 |
| 황철석 | Pyrite | 559 |
| 흑요석 | Obsidian | 575 |

## 유물 / 화석 / 미이라

| 한글 | English | ID |
|---|---|---|
| 고대 검 | Ancient Sword | 109 |
| 고대 북 | Ancient Drum | 123 |
| 고대 씨앗 (유물) | Ancient Seed | 114 |
| 고대 인형 | Ancient Doll | 103 |
| 깨진 암포라 | Chipped Amphora | 100 |
| 꼬리 뼈 | Skeletal Tail | 585 |
| 녹슨 숟가락 | Rusty Spoon | 110 |
| 녹슨 징 | Rusty Spur | 111 |
| 녹슨 톱니바퀴 | Rusty Cog | 112 |
| 닭 동상 | Chicken Statue | 113 |
| 닻 | Anchor | 117 |
| 드워프 도구 | Dwarf Gadget | 122 |
| 드워프 두루마리 I | Dwarf Scroll I | 96 |
| 드워프 두루마리 II | Dwarf Scroll II | 97 |
| 드워프 두루마리 III | Dwarf Scroll III | 98 |
| 드워프 두루마리 IV | Dwarf Scroll IV | 99 |
| 드워프 투구 | Dwarvish Helm | 121 |
| 뼈피리 | Bone Flute | 119 |
| 말린 불가사리 | Dried Starfish | 116 |
| 삼엽충 | Trilobite | 589 |
| 선사 시대 견갑골 | Prehistoric Scapula | 579 |
| 선사 시대 경골 | Prehistoric Tibia | 580 |
| 선사 시대 늑골 | Prehistoric Rib | 583 |
| 선사 시대 도구 | Prehistoric Tool | 115 |
| 선사 시대 두개골 | Prehistoric Skull | 581 |
| 선사 시대 손도끼 | Prehistoric Handaxe | 120 |
| 선사 시대 척추골 | Prehistoric Vertebra | 584 |
| 손 뼈 | Skeletal Hand | 582 |
| 씹는 막대 | Chewing Stick | 105 |
| 앵무조개 화석 | Nautilus Fossil | 586 |
| 야자 화석 | Palm Fossil | 588 |
| 양서류 화석 | Amphibian Fossil | 587 |
| 엘프 장신구 | Elvish Jewelry | 104 |
| 유리 파편 | Glass Shards | 118 |
| 이상한 인형(노란색) | Strange Doll | 127 |
| 이상한 인형(녹색) | Strange Doll | 126 |
| 화려한 부채 | Ornamental Fan | 106 |
| 화살촉 | Arrowhead | 101 |
| 황금 가면 | Golden Mask | 124 |
| 황금 유물 | Golden Relic | 125 |
| 희귀한 원반 | Rare Disc | 108 |
| 화석화된 늑골 | Fossilized Ribs | 824 |
| 화석화된 두개골 | Fossilized Skull | 820 |
| 뱀 두개골 | Snake Skull | 825 |
| 화석화된 척추 | Fossilized Spine | 821 |
| 뱀 척추 | Snake Vertebrae | 826 |
| 화석화된 꼬리 | Fossilized Tail | 822 |
| 미이라화된 박쥐 | Mummified Bat | 827 |
| 화석화된 다리 | Fossilized Leg | 823 |
| 미이라화된 개구리 | Mummified Frog | 828 |

## 정동석 / 유물 상자 / 황금 코코넛 / 미스테리 박스

| 한글 | English | ID |
|---|---|---|
| 정동석 | Geode | 535 |
| 얼어붙은 정동석 | Frozen Geode | 536 |
| 마그마 정동석 | Magma Geode | 537 |
| 전 정동석 | Omni Geode | 749 |
| 유물 상자 | Artifact Trove | 275 |
| 황금 코코넛 | Golden Coconut | 791 |
| 미스테리 박스 | Mystery Box | MysteryBox |
| 황금 미스테리 박스 | Golden Mystery Box | GoldenMysteryBox |

## 부케 / 펜던트 / 토템 / 폭탄 / 티켓 / 퀘스트 / 축제

| 한글 | English | ID |
|---|---|---|
| 부케 | Bouquet | 458 |
| 시들은 부케 | Wilted Bouquet | 277 |
| 인어의 펜던트 | Mermaid's Pendant | 460 |
| 공허 유령 펜던트 | Void Ghost Pendant | 808 |
| 비의 토템 | Rain Totem | 681 |
| 워프 토템: 농장 | Warp Totem: Farm | 688 |
| 워프 토템: 산 | Warp Totem: Mountains | 689 |
| 워프 토템: 해변 | Warp Totem: Beach | 690 |
| 워프 토템: 사막 | Warp Totem: Desert | 261 |
| 워프 토템: 섬 | Warp Totem: Island | 886 |
| 보물 토템 | Treasure Totem | TreasureTotem |
| 폭발성 탄약 | Explosive Ammo | 441 |
| 체리 폭탄 | Cherry Bomb | 286 |
| 폭탄 | Bomb | 287 |
| 거대 폭탄 | Mega Bomb | 288 |
| 영화표 | Movie Ticket | 809 |
| 경품 티켓 | Prize Ticket | PrizeTicket |
| 황금 꼬리표 | Golden Tag | TroutDerbyTag |
| 잃어버린 도끼 | Lost Axe | 788 |
| 전쟁 유품 | War Memento | 864 |
| 베리 바구니 | Berry Basket | 790 |
| 미식가의 토마토 소금 | Gourmet Tomato Salt | 865 |
| 무지갯빛 젤리 | Prismatic Jelly | 876 |
| 스타듀 밸리 장미 | Stardew Valley Rose | 866 |
| 화려한 목걸이 | Ornate Necklace | 191 |
| 고급 TV 리모콘 | Advanced TV Remote | 867 |
| 심령체 | Ectoplasm | 875 |
| 북극 파편 | Arctic Shard | 868 |
| 먼 곳의 돌 | Far Away Stone | FarAwayStone |
| 꿈틀거리는 지렁이 | Wriggling Worm | 869 |
| 칼리코 달걀 | Calico Egg | CalicoEgg |
| 해적의 로켓 목걸이 | Pirate's Locket | 870 |
| 황금 찌 | Golden Bobber | GoldenBobber |

## 책

| 한글 | English | ID |
|---|---|---|
| 드워프어 번역 가이드 | Dwarvish Translation Guide | 326 |
| 스타듀 밸리 연감 | Stardew Valley Almanac | SkillBook_0 |
| 미끼와 찌 | Bait And Bobber | SkillBook_1 |
| 주간 나무꾼 | Woodcutter's Weekly | SkillBook_2 |
| 월간 광부 | Mining Monthly | SkillBook_3 |
| 계간 전투 | Combat Quarterly | SkillBook_4 |
| 가격 카탈로그 | Price Catalogue | Book_PriceCatalogue |
| 게잡이의 기술 | The Art O' Crabbing | Book_Crabbing |
| 고대의 보물 - 감정 가이드 | Book_Artifact | Book_Artifact |
| 골목 뷔페 | The Alleyway Buffet | Book_Trash |
| 날렵하렴 잭, 두꺼우렴 잭 | Jack Be Nimble, Jack Be Thick | Book_Defense |
| 너구리 일기 | Ways Of The Wild | Book_WildSeeds |
| 늙은 미끌다리 | Book_Grass | Book_Grass |
| 다이아몬드 사냥꾼 | The Diamond Hunter | Book_Diamonds |
| 동굴 지도 제작법 | Mapping Cave Systems | Book_Marlon |
| 동물 카탈로그 | Animal Catalogue | Book_AnimalCatalogue |
| 드워프 안전 지침서 | Dwarvish Safety Manual | Book_Bombs |
| 말의 모든 것 | Book_Horse | Book_Horse |
| 몬스터 개요서 | Monster Compendium | Book_Void |
| 미스테리의 책 | Book of Mysteries | Book_Mystery |
| 바다의 보석 | Jewels Of The Sea | Book_Roe |
| 별의 책 | Book Of Stars | PurpleBook |
| 바람의 길 파트 1 | Way Of The Wind pt. 1 | Book_Speed |
| 바람의 길 파트 2 | Way Of The Wind pt. 2 | Book_Speed2 |
| 소스의 여왕 요리서 | Queen Of Sauce Cookbook | Book_QueenOfSauce |
| 우디의 비밀 | Woody's Secret | Book_Woodcutting |
| 우정 101 | Friendship 101 | Book_Friendship |

## 물고기

| 한글 | English | ID |
|---|---|---|
| 강꼬치고기 | Pike | 144 |
| 가자미 | Flounder | 267 |
| 농어 | Perch | 141 |
| 날개다랑어 | Albacore | 705 |
| 눈동자개 | Bullhead | 700 |
| 넙치 | Halibut | 708 |
| 도미 | Bream | 132 |
| 멸치 | Anchovy | 129 |
| 만새기 | Dorado | 704 |
| 붉은 퉁돔 | Red Snapper | 150 |
| 망둑어 | Goby | Goby |
| 숭어 | Red Mullet | 146 |
| 메기 | Catfish | 143 |
| 정어리 | Sardine | 131 |
| 무지개송어 | Rainbow Trout | 138 |
| 청어 | Herring | 147 |
| 범노래미 | Lingcod | 707 |
| 참치 | Tuna | 130 |
| 선피쉬(개복치) | Sunfish | 145 |
| 틸라피아 | Tilapia | 701 |
| 숲고기 | Woodskip | 734 |
| 복어 | Pufferfish | 128 |
| 연어 | Salmon | 139 |
| 해삼 | Sea Cucumber | 154 |
| 전어 | Shad | 706 |
| 슈퍼해삼 | Super Cucumber | 155 |
| 타이거 송어 | Tiger Trout | 699 |
| 장어 | Eel | 148 |
| 잉어 | Carp | 142 |
| 문어 | Octopus | 149 |
| 자정 잉어 | Midnight Carp | 269 |
| 오징어 | Squid | 151 |
| 작은입우럭 | Smallmouth Bass | 137 |
| 자정오징어 | Midnight Squid | 798 |
| 큰입우럭 | Largemouth Bass | 136 |
| 통안어 | Spook Fish | 799 |
| 월아이 | Walleye | 140 |
| 블롭피쉬 | Blobfish | 800 |
| 철갑상어 | Sturgeon | 698 |
| 블루 디스커스 | Blue Discus | 838 |
| 피라미 | Chub | 702 |
| 쏠배감펭 | Lionfish | 837 |
| 귀신물고기 | Ghostfish | 156 |
| 가오리 | Stingray | 836 |
| 도루묵 | Sandfish | 164 |
| 공허의 연어 | Void Salmon | 795 |
| 전갈 잉어 | Scorpion Carp | 165 |
| 슬라임잭 | Slimejack | 796 |
| 돌연변이 잉어 | Mutant Carp | 682 |
| 쑥치 | Stonefish | 158 |
| 방사능 잉어 | Radioactive Carp | 901 |
| 아이스핍 | Ice Pip | 161 |
| 아귀 | Angler | 160 |
| 용암 장어 | Lava Eel | 162 |
| 아귀 아씨 | Ms. Angler | 899 |
| 크림슨피쉬 | Crimsonfish | 159 |
| 크림슨피쉬의 아들 | Son of Crimsonfish | 898 |
| 빙하고기 | Glacierfish | 775 |
| 빙하고기 주니어 | Glacierfish Jr. | 902 |
| 전설의 물고기 | Legend | 163 |
| 전설의 물고기 II | Legend II | 900 |
| 훈제 | Smoked Fish | SmokedFish |
| 훈제 가오리 | Smoked Stingray | SmokedFish/836 |

## 갑각류 / 조개류 / 해양 채집물

| 한글 | English | ID |
|---|---|---|
| 게 | Crab | 717 |
| 굴 | Oyster | 723 |
| 달팽이 | Snail | 721 |
| 민물가재 | Crayfish | 716 |
| 바닷가재 | Lobster | 715 |
| 새우 | Shrimp | 720 |
| 새조개 | Cockle | 718 |
| 충알고둥 | Periwinkle | 722 |
| 홍합 | Mussel | 719 |
| 무지개 껍데기 | Rainbow Shell | 394 |
| 앵무조개 껍데기 | Nautilus Shell | 392 |
| 성게 | Sea Urchin | 397 |
| 조개 | Clam | 372 |
| 산호 | Coral | 393 |
| 해초 | Seaweed | 152 |
| 녹조류 | Green Algae | 153 |
| 흰 조류 | White Algae | 157 |

## 어란 / 오징어 먹물 / 젤리

| 한글 | English | ID |
|---|---|---|
| 어란 | Roe | 812 |
| 숙성된 어란 | Aged Roe | 447 |
| 가오리 어란 | Stingray Roe | 812/836 |
| 숙성된 가오리 어란 | Aged Stingray Roe | 447/836 |
| 철갑상어 어란 | Sturgeon Roe | 812/698 |
| 캐비아 | Caviar | 445 |
| 오징어 먹물 | Squid Ink | 814 |
| 강 젤리 | River Jelly | RiverJelly |
| 동굴 젤리 | Cave Jelly | CaveJelly |
| 바다 젤리 | Sea Jelly | SeaJelly |

## 미끼 / 찌 / 통발

| 한글 | English | ID |
|---|---|---|
| 미끼 | Bait | 685 |
| 미끼 (특정 미끼 기본) | Bait | SpecificBait |
| 게 미끼 | Crab Bait | SpecificBait/717 |
| 만새기 미끼 | Dorado Bait | SpecificBait/704 |
| 자석 | Magnet | 703 |
| 야생 미끼 | Wild Bait | 774 |
| 마법 미끼 | Magic Bait | 908 |
| 디럭스 미끼 | Deluxe Bait | DeluxeBait |
| 도전 미끼 | Challenge Bait | ChallengeBait |
| 회전식 미끼 | Spinner | 686 |
| 꾸며진 회전식 미끼 | Dressed Spinner | 687 |
| 호기심 미끼 | Curiosity Lure | 856 |
| 가시 돋친 낚시바늘 | Barbed Hook | 691 |
| 무거운 찌 | Lead Bobber | 692 |
| 보물사냥꾼 | Treasure Hunter | 693 |
| 고급 찌 | Quality Bobber | 877 |
| 음파탐지 찌 | Sonar Bobber | SonarBobber |
| 코르크 찌 | Cork Bobber | 695 |
| 함정 찌 | Trap Bobber | 694 |
| 게잡이 통발 | Crab Pot | 710 |

## 요리 / 재료

| 한글 | English | ID |
|---|---|---|
| 가을의 수확 | Autumn's Bounty | 235 |
| 가재 비스크 | Lobster Bisque | 730 |
| 가지 파마산 | Eggplant Parmesan | 231 |
| 게살 케이크 | Crab Cakes | 732 |
| 계란 프라이 | Fried Egg | 194 |
| 과일 샐러드 | Fruit Salad | 610 |
| 광부의 간식 | Miner's Treat | 243 |
| 구운 헤이즐넛 | Roasted Hazelnuts | 607 |
| 깜짝 잉어 | Carp Surprise | 209 |
| 녹조류 스프 | Algae Soup | 456 |
| 농부의 점심 | Farmer's Lunch | 240 |
| 대황 파이 | Rhubarb Pie | 222 |
| 또띠아 | Tortilla | 229 |
| 똠카 스프 | Tom Kha Soup | 218 |
| 라이스 푸딩 | Rice Pudding | 232 |
| 마법 얼음 사탕 | Magic Rock Candy | 279 |
| 마키 롤 | Maki Roll | 228 |
| 맛탕 | Glazed Yams | 208 |
| 매콤한 장어 | Spicy Eel | 226 |
| 메이플바 | Maple Bar | 731 |
| 무 샐러드 | Radish Salad | 609 |
| 바나나 푸딩 | Banana Pudding | 904 |
| 바다 거품 푸딩 | Seafoam Pudding | 265 |
| 바다의 요리 | Dish O' The Sea | 242 |
| 버섯 구이 | Fried Mushroom | 205 |
| 붉은 정식 | Red Plate | 230 |
| 브루쉐타 | Bruschetta | 618 |
| 블랙베리 코블러 | Blackberry Cobbler | 611 |
| 블루베리 타르트 | Blueberry Tart | 234 |
| 빵 | Bread | 216 |
| 뿌리채소 모음 | Roots Platter | 244 |
| 새우 칵테일 | Shrimp Cocktail | 733 |
| 샐러드 | Salad | 196 |
| 생선 스튜 | Fish Stew | 728 |
| 생선 타코 | Fish Taco | 213 |
| 생선구이 | Baked Fish | 198 |
| 생존형 버거 | Survival Burger | 241 |
| 설탕당근 스프 | Parsnip Soup | 199 |
| 송어 스프 | Trout Soup | 219 |
| 수상한 롤 | Strange Bun | 203 |
| 슈퍼 건강식 | Super Meal | 237 |
| 스파게티 | Spaghetti | 224 |
| 아이스크림 | Ice Cream | 233 |
| 아티초크 소스 | Artichoke Dip | 605 |
| 야채 볶음 | Stir Fry | 606 |
| 야채의 메들리 | Vegetable Medley | 200 |
| 양귀비씨 머핀 | Poppyseed Muffin | 651 |
| 에스카르고 | Escargot | 729 |
| 연어 정찬 | Salmon Dinner | 212 |
| 열대 카레 | Tropical Curry | 907 |
| 오믈렛 | Omelet | 195 |
| 오징어 먹물 라비올리 | Squid Ink Ravioli | 921 |
| 오징어튀김 | Fried Calamari | 202 |
| 완벽한 아침 | Complete Breakfast | 201 |
| 요리용 속 | Stuffing | 239 |
| 우럭 튀김 | Crispy Bass | 214 |
| 이끼 스프 | Moss Soup | MossSoup |
| 자두 푸딩 | Plum Pudding | 604 |
| 장어튀김 | Fried Eel | 225 |
| 진저 에일 | Ginger Ale | 903 |
| 차우더 | Chowder | 727 |
| 창백한 죽 | Pale Broth | 457 |
| 청나래고사리 리조또 | Fiddlehead Risotto | 649 |
| 초콜릿 케이크 | Chocolate Cake | 220 |
| 치즈 콜리플라워 | Cheese Cauliflower | 197 |
| 카오 니야우 마무앙 | Mango Sticky Rice | 905 |
| 코울슬로 | Coleslaw | 648 |
| 콩 스튜 | Bean Hotpot | 207 |
| 쿠키 | Cookie | 223 |
| 크랜베리 소스 | Cranberry Sauce | 238 |
| 크랜베리 캔디 | Cranberry Candy | 612 |
| 팬케이크 | Pancakes | 211 |
| 페퍼파퍼 | Pepper Poppers | 215 |
| 포이 | Poi | 906 |
| 피나콜라다 | Piña Colada | 873 |
| 피자 | Pizza | 206 |
| 핑크 케이크 | Pink Cake | 221 |
| 해시브라운 | Hashbrowns | 210 |
| 행운의 점심 | Lucky Lunch | 204 |
| 호박 파이 | Pumpkin Pie | 608 |
| 호박죽 | Pumpkin Soup | 236 |
| 회 | Sashimi | 227 |
| 기름 | Oil | 247 |
| 밀가루 | Wheat Flour | 246 |
| 설탕 | Sugar | 245 |
| 식초 | Vinegar | 419 |
| 쌀 | Rice | 423 |

## 비밀 노트 / 일지 조각

| 한글 | English | ID |
|---|---|---|
| 비밀 노트 #1~27 | Secret Note | 79/1 ~ 79/27 |
| 일지 조각 #1~11 | Journal Scrap | 842/1 ~ 842/11 |

## 기타

| 한글 | English | ID |
|---|---|---|
| 별방울 | Stardrop | 434 |
| 이리듐 우유 | Iridium Milk | 803 |
| 갤럭시 소울 | Galaxy Soul | 896 |
| 다기세트 | Tea Set | 341 |
| 드럼 블록 | Drum Block | 463 |
| 플루트 블록 | Flute Block | 464 |
| 보물상자 | Treasure Chest | 166 |
| 장식용 항아리 | Decorative Pot | 461 |
| 몬스터 사향 | Monster Musk | 879 |
| 호박등 | Jack-O-Lantern | 746 |
| 폭죽(빨강) | Fireworks (Red) | 893 |
| 폭죽(보라) | Fireworks (Purple) | 894 |
| 폭죽(초록) | Fireworks (Green) | 895 |
| 횃불 | Torch | 93 |
| 영혼 횃불 | Spirit Torch | 94 |
| 피에르의 잃어버린 재고 목록 | Pierre's Missing Stocklist | 897 |
| 황금 호두 | Golden Walnut | 73 |
| 야외 요리 키트 | Cookout Kit | 926 |
| 치 보석 | Qi Gem | 858 |
| 텐트 키트 | Tent Kit | TentKit |
| 치의 양념 | Qi Seasoning | 917 |
| 행운의 보라 반바지 | Lucky Purple Shorts | 789 |
| 요정 가루 | Fairy Dust | 872 |
| 테두리가 장식된 행운의 보라 반바지 | Trimmed Lucky Purple Shorts | 71 |
| 나비 가루 | Butterfly Powder | ButterflyPowder |
| 조자 콜라 | Joja Cola | 167 |
| 깨진 안경 | Broken Glasses | 170 |
| 썩은 식물 | Rotten Plant | 747 |
| 깨진 CD | Broken CD | 171 |
| 썩은 식물 (2) | Rotten Plant | 748 |
| 쓰레기 | Trash | 168 |
| 젖은 신문지 | Soggy Newspaper | 172 |
| 유목 | Driftwood | 169 |
| 말 피리 | Horse Flute | 911 |

## 반지

| 한글 | English | 효과 | ID |
|---|---|---|---|
| 가시 반지 | Thorns Ring | 적이 착용자에게 피해를 입히면 적도 함께 피해를 입음 | 839 |
| 게딱지 반지 | Crabshell Ring | 방어력 +5 | 810 |
| 결혼 반지 | Wedding Ring | 멀티플레이에서 플레이어끼리 결혼 가능 | 801 |
| 네이팜 반지 | Napalm Ring | 적을 쓰러트리면 적이 폭발 | 811 |
| 도둑의 반지 | Burglar's Ring | 치명타 위력 +10% | 526 |
| 루비 반지 | Ruby Ring | 공격력 +10% | 534 |
| 면역의 띠 | Immunity Band | 면역력 +4 | 887 |
| 발광석 반지 | Glowstone Ring | 반경 10칸 빛, 자력 +2칸 | 888 |
| 보호의 반지 | Protection Ring | 피격 후 무적시간 +0.4초 | 861 |
| 불사조 반지 | Phoenix Ring | 하루 1회, 쓰러진 후 체력 50% 회복 | 863 |
| 빛 반지 | Glow Ring | 반경 10칸 빛, 다른 빛 반지와 중첩 | 517 |
| 슬라임부리미 반지 | Slime Charmer Ring | 슬라임에게 받는 피해 방지 | 520 |
| 아쿠아마린 반지 | Aquamarine Ring | 치명타 확률 +10% | 531 |
| 에메랄드 반지 | Emerald Ring | 무기 속도 +10% | 533 |
| 영혼을 거두는 반지 | Soul Sapper Ring | 적 처치 시 기력 소량 회복 | 862 |
| 옥 반지 | Jade Ring | 치명타 위력 +10% | 532 |
| 요바의 반지 | Ring of Yoba | 피격 시 확률적으로 요바의 축복 버프 | 524 |
| 이리듐 밴드 | Iridium Band | 빛, 아이템 흡수, 공격력 +10% | 527 |
| 자석 반지 | Magnet Ring | 아이템 수집 범위 증가 (중첩됨) | 519 |
| 자수정 반지 | Amethyst Ring | 적을 10% 더 멀리 밀쳐냄 | 529 |
| 작은빛 반지 | Small Glow Ring | 반경 5칸 빛, 중첩됨 | 516 |
| 작은자석 반지 | Small Magnet Ring | 아이템 수집 범위 소폭 증가 (중첩됨) | 518 |
| 전사 반지 | Warrior Ring | 몬스터 처치 후 가끔 "전사의 기운" | 521 |
| 주크박스 반지 | Jukebox Ring | 들어본 노래를 무작위 재생 | 528 |
| 토파즈 반지 | Topaz Ring | 무기 명중률 +10% | 530 |
| 튼튼한 반지 | Sturdy Ring | 상태 이상 지속시간 절반 | 525 |
| 핫 자바 반지 | Hot Java Ring | 몬스터가 커피/트리플 샷 에스프레소를 드랍할 확률 증가 | 860 |
| 행운의 반지 | Lucky Ring | 행운 +1 | 859 |
| 흉포한 반지 | Savage Ring | 몬스터 처치 시 2초간 속도 +2 | 523 |
| 흡혈 반지 | Vampire Ring | 몬스터 처치 시 체력 2 회복 | 522 |

---

# 2. 제작품 (BC)

## 보관함 / 저장

| 한글 | English | ID |
|---|---|---|
| 보관함 | Chest | 130 |
| 큰 보관함 | Big Chest | BigChest |
| 석조 보관함 | Stone Chest | 232 |
| 큰 석조 보관함 | Big Stone Chest | BigStoneChest |
| 주니모 보관함 | Junimo Chest | 256 |
| 미니 배송함 | Mini-Shipping Bin | 248 |

## 가공 / 기계

| 한글 | English | ID |
|---|---|---|
| 용광로 | Furnace | 13 |
| 중형 용광로 | Heavy Furnace | HeavyFurnace |
| 재활용 기계 | Recycling Machine | 20 |
| 씨앗 생성기 | Seed Maker | 25 |
| 결정생성기 | Crystalarium | 21 |
| 숯 가마 | Charcoal Kiln | 114 |
| 뼈 제분기 | Bone Mill | 90 |
| 제작품 해체기 | Deconstructor | 265 |
| 정동석 분쇄기 | Geode Crusher | 182 |
| 목재파쇄기 | Wood Chipper | 211 |
| 미니-대장간 | Mini-Forge | MiniForge |
| 지렁이 통 | Worm Bin | 154 |
| 모루 | Anvil | Anvil |
| 디럭스 지렁이 통 | Deluxe Worm Bin | DeluxeWormBin |
| 작업대 | Workbench | 208 |
| 미끼 제작기 | Bait Maker | BaitMaker |
| 재봉틀 | Sewing Machine | 247 |
| 생선 훈제기 | Fish Smoker | FishSmoker |
| 소다 머신 | Soda Machine | 117 |
| 커피 메이커 | Coffee Maker | 246 |
| 탈수기 | Dehydrator | Dehydrator |
| 마요네즈 기계 | Mayonnaise Machine | 24 |
| 치즈 착제기 | Cheese Press | 16 |
| 물레 | Loom | 17 |
| 착유기 | Oil Maker | 19 |
| 술통 | Keg | 12 |
| 절임통 | Preserves Jar | 15 |
| 숙성용 나무통 | Cask | 163 |
| 수액 채취기 | Tapper | 105 |
| 중형 수액 채취기 | Heavy Tapper | 264 |
| 양봉장 | Bee House | 10 |
| 버섯 상자 | Mushroom Box | 128 |
| 버섯 통나무 | Mushroom Log | MushroomLog |
| 피뢰침 | Lightning Rod | 9 |
| 태양 전지판 | Solar Panel | 231 |
| 계단 | Staircase | 71 |
| 호퍼 | Hopper | 275 |
| 자동 채집기 | Auto-Grabber | 165 |
| 자동 쓰다듬기 기계 | Auto-Petter | 272 |

## 동물 시설

| 한글 | English | ID |
|---|---|---|
| 부화기 | Incubator | 101 |
| 타조알 부화기 | Ostrich Incubator | 254 |
| 사료 호퍼 | Feed Hopper | 99 |
| 히터 | Heater | 104 |
| 슬라임볼 | Slime Ball | 56 |
| 슬라임 부화기 | Slime Incubator | 156 |
| 슬라임 알 압착기 | Slime Egg-Press | 158 |
| 장식용 건초 더미 | Ornamental Hay Bale | 45 |

## 가전 / 편의

| 한글 | English | ID |
|---|---|---|
| 미니-냉장고 | Mini-Fridge | 216 |
| 전화기 | Telephone | 214 |
| 농장 컴퓨터 | Farm Computer | 239 |
| 미니 오벨리스크 | Mini-Obelisk | 238 |

## 조명 / 화로 / 표지판

| 한글 | English | ID |
|---|---|---|
| 나무 표지판 | Wood Sign | 37 |
| 돌 표지판 | Stone Sign | 38 |
| 어두운 표지판 | Dark Sign | 39 |
| 글 표지판 | Text Sign | TextSign |
| 모닥불 | Campfire | 146 |
| 모닥불(야외 요리) | Campfire | 278 |
| 긴 횃불 | Tall Torch | 72 |
| 나무 화로 | Wooden Brazier | 143 |
| 나무통 화로 | Barrel Brazier | 150 |
| 돌 화로 | Stone Brazier | 144 |
| 대리석 화로 | Marble Brazier | 151 |
| 황금 화로 | Gold Brazier | 145 |
| 목제 가로등 | Wood Lamp-post | 152 |
| 조각된 화로 | Carved Brazier | 148 |
| 철제 가로등 | Iron Lamp-post | 153 |
| 해골 화로 | Skull Brazier | 149 |

## 장식 / 조각상

| 한글 | English | ID |
|---|---|---|
| (이름 없음) | Item Pedestal | 221 |
| 그릇의 표식 | Sign Of The Vessel | 34 |
| 기본 통나무 | Basic Log | 35 |
| 늘보 해골 L | Sloth Skeleton L | 85 |
| 늘보 해골 M | Sloth Skeleton | 86 |
| 늘보 해골 R | Sloth Skeleton R | 87 |
| 전시용 정동석 | Standing Geode | 88 |
| 흑요석 항아리 | Obsidian Vase | 89 |
| 돌더미 | Stone Cairn | 32 |
| 해골 모형 | Skeleton Model | 28 |
| 묘비 | Grave Stone | 47 |
| 장식용 갑옷 | Suit Of Armor | 33 |
| 오벨리스크 | Obelisk | 29 |
| 큰 초록 사탕장식 | Big Green Cane | 40 |
| 초록 사탕장식 | Green Canes | 41 |
| 큰 빨간 사탕장식 | Big Red Cane | 44 |
| 빨간 사탕장식 | Red Canes | 43 |
| 두 가지 색 사탕장식 | Mixed Cane | 42 |
| 노래하는 돌 | Singing Stone | 94 |
| 플라밍고 모형 | Lawn Flamingo | 36 |
| 봉제 토끼 인형 | Plush Bunny | 107 |
| 괘종시계 | Grandfather Clock | 68 |
| 테디 타이머 | Teddy Timer | 69 |
| 통나무 단면 | Log Section | 46 |
| 책장 | Bookcase | 64 |
| 봉고 | Bongo | 75 |
| 화려한 테이블 | Fancy Table | 65 |
| 의식용 가면 | Ritual Mask | 73 |
| 장식용 창 | Decorative Spears | 76 |
| 사진기 | Camera | 106 |
| 이상한 캡슐 | Strange Capsule | 96 |
| 장식용 항아리 | Decorative Pitcher | 111 |
| 빈 캡슐 | Empty Capsule | 98 |
| 정원용 화분 | Garden Pot | 62 |
| 죽은 나무 | Dead Tree | 70 |
| 말린 해바라기 | Dried Sunflowers | 112 |
| 계절 장식 | Seasonal Decor | 48 |
| HMTGF | HMTGF | 155 |
| Pinky Lemon | Pinky Lemon | 161 |
| Foroguemon | Foroguemon | 162 |

## 식물

| 한글 | English | ID |
|---|---|---|
| 실내용 화초 | House Plant | 0, 1, 2, 3, 4, 5, 6, 7 |
| 계절 식물 | Seasonal Plant | 184, 188, 192, 196, 200, 204 |
| 꽃바구니 | Tub o' Flowers | 108, 109 |

## 석상 / 조각상 / 트로피

| 한글 | English | ID |
|---|---|---|
| 개구리 석상 | Stone Frog | 52 |
| 앵무새 석상 | Stone Parrot | 53 |
| 부엉이 석상 | Stone Owl | 54, 95 |
| 주니모 석상 | Stone Junimo | 55 |
| 닭 목조상 | Chicken Statue | 31 |
| 사악한 석상 | Wicked Statue | 83 |
| 순금 루이스 | Solid Gold Lewis | 164 |
| 스타듀 영웅 트로피 | Stardew Hero Trophy | 116 |
| 끝없는 행운의 조각상 | Statue Of Endless Fortune | 127 |
| 완벽함의 조각상 | Statue Of Perfection | 160 |
| 축복의 조각상 | Statue Of Blessings | StatueOfBlessings |
| 진정한 완벽의 동상 | Statue Of True Perfection | 280 |
| 드워프 킹의 조각상 | Statue Of The Dwarf King | StatueOfTheDwarfKing |

## 허수아비

| 한글 | English | ID |
|---|---|---|
| 허수아비 | Scarecrow | 8 |
| 디럭스 허수아비 | Deluxe Scarecrow | 167 |
| 희귀한 허수아비 | Rarecrow | 110, 113, 126, 136, 137, 138, 139, 140 |

## 게임기 / 음악

| 한글 | English | ID |
|---|---|---|
| 미니-주크박스 | Mini-Jukebox | 209 |
| 주니모 카트 게임기 | Junimo Kart Arcade System | 159 |
| 대초원의 왕 게임기 | Prairie King Arcade System | 141 |
| 저주받은 대초원의 왕 게임기 | Cursed P.K. Arcade System | 219 |

---

# 3. 도구 (T)

ID는 문자열 그대로 사용 (예: `Player_add (T)IridiumAxe`).

| 한글 | English | ID |
|---|---|---|
| 양털 가위 | Shears | Shears |
| 우유 들통 | Milk Pail | MilkPail |
| 곡괭이 | Pickaxe | Pickaxe |
| 구리 곡괭이 | Copper Pickaxe | CopperPickaxe |
| 강철 곡괭이 | Steel Pickaxe | SteelPickaxe |
| 황금 곡괭이 | Gold Pickaxe | GoldPickaxe |
| 이리듐 곡괭이 | Iridium Pickaxe | IridiumPickaxe |
| 도끼 | Axe | Axe |
| 구리 도끼 | Copper Axe | CopperAxe |
| 강철 도끼 | Steel Axe | SteelAxe |
| 황금 도끼 | Gold Axe | GoldAxe |
| 이리듐 도끼 | Iridium Axe | IridiumAxe |
| 물뿌리개 | Watering Can | WateringCan |
| 구리 물뿌리개 | Copper Watering Can | CopperWateringCan |
| 강철 물뿌리개 | Steel Watering Can | SteelWateringCan |
| 황금 물뿌리개 | Gold Watering Can | GoldWateringCan |
| 이리듐 물뿌리개 | Iridium Watering Can | IridiumWateringCan |
| 호미 | Hoe | Hoe |
| 구리 호미 | Copper Hoe | CopperHoe |
| 강철 호미 | Steel Hoe | SteelHoe |
| 황금 호미 | Gold Hoe | GoldHoe |
| 이리듐 호미 | Iridium Hoe | IridiumHoe |
| 구리 선광 냄비 | Copper Pan | Pan |
| 강철 선광 냄비 | Steel Pan | SteelPan |
| 황금 선광 냄비 | Gold Pan | GoldPan |
| 이리듐 선광 냄비 | Iridium Pan | IridiumPan |
| 대나무 막대 | Bamboo Pole | BambooPole |
| 연습용 낚싯대 | Training Rod | TrainingRod |
| 섬유 유리 낚싯대 | Fiberglass Rod | FiberglassRod |
| 이리듐 낚싯대 | Iridium Rod | IridiumRod |
| 고급 이리듐 낚싯대 | Advanced Iridium Rod | AdvancedIridiumRod |
| 귀환의 지팡이 | Return Scepter | ReturnScepter |

---

# 4. 무기 (W)

## 검 / 단검 / 둔기 / 새총 / 낫

| 한글 | English | ID |
|---|---|---|
| 녹슨 검 | Rusty Sword | 0 |
| 은 사브르 | Silver Saber | 1 |
| 어둠의 검 | Dark Sword | 2 |
| 성검 | Holy Blade | 3 |
| 갤럭시 소드 | Galaxy Sword | 4 |
| 뼈의 검 | Bone Sword | 5 |
| 철의 날 | Iron Edge | 6 |
| 기사단원의 검 | Templar's Blade | 7 |
| 흑요도 | Obsidian Edge | 8 |
| 용암 카타나 | Lava Katana | 9 |
| 클레이모어 | Claymore | 10 |
| 강철 소검 | Steel Smallsword | 11 |
| 목도 | Wooden Blade | 12 |
| 곤충 머리 | Insect Head | 13 |
| 넵튠의 글레이브 | Neptune's Glaive | 14 |
| 숲의 검 | Forest Sword | 15 |
| 카빙 나이프 | Carving Knife | 16 |
| 철 더크 | Iron Dirk | 17 |
| 강도의 쉥크 | Burglar's Shank | 18 |
| 그림자 단검 | Shadow Dagger | 19 |
| 엘프 블레이드 | Elf Blade | 20 |
| 수정 단검 | Crystal Dagger | 21 |
| 윈드 스파이어 | Wind Spire | 22 |
| 갤럭시 대거 | Galaxy Dagger | 23 |
| 나무 몽둥이 | Wood Club | 24 |
| 나무망치 | Wood Mallet | 27 |
| 슬래머 | The Slammer | 28 |
| 갤럭시 해머 | Galaxy Hammer | 29 |
| 납 막대기 | Lead Rod | 26 |
| 대퇴골 | Femur | 31 |
| 새총 | Slingshot | 32 |
| 마스터 새총 | Master Slingshot | 33 |
| 갤럭시 새총 | Galaxy Slingshot | 34 |
| 사악한 크리스 | Wicked Kris | 45 |
| 곤봉 | Kudgel | 46 |
| 낫 | Scythe | 47 |
| 예티 이빨 | Yeti Tooth | 48 |
| 레이피어 | Rapier | 49 |
| 강철 언월도 | Steel Falchion | 50 |
| 부러진 삼지창 | Broken Trident | 51 |
| 단련된 브로드소드 | Tempered Broadsword | 52 |
| 황금 낫 | Golden Scythe | 53 |
| 드워프 검 | Dwarf Sword | 54 |
| 드워프 해머 | Dwarf | 55 |
| 드워프 단검 | Dwarf Dagger | 56 |
| 용이빨 커틀러스 | Dragontooth Cutlass | 57 |
| 용이빨 곤봉 | Dragontooth Club | 58 |
| 용이빨 시브 | Dragontooth Shiv | 59 |
| 골화된 블레이드 | Ossified Blade | 60 |
| 이리듐 바늘 | Iridium Needle | 61 |
| 인피니티 블레이드 | Infinity Blade | 62 |
| 인피니티 의사봉 | Infinity Gavel | 63 |
| 인피니티 대거 | Infinity Dagger | 64 |
| 미야우미어 | Meowmere | 65 |
| 이리듐 낫 | Iridium Scythe | 66 |
| 해적의 검 | Pirate's Sword | 43 |
| 커틀라스 | Cutlass | 44 |

## 주민 관련 무기

| 한글 | English | ID |
|---|---|---|
| 알렉스의 방망이 | Alex's Bat | 25 |
| 샘의 오래된 기타 | Sam's Old Guitar | 30 |
| 엘리엇의 연필 | Elliott's Pencil | 35 |
| 마루의 렌치 | Maru's Wrench | 36 |
| 하비의 망치 | Harvey's Mallet | 37 |
| 페니의 프라이팬 | Penny's Fryer | 38 |
| 레아의 나무깎이 | Leah's Whittler | 39 |
| 애비의 심령판 | Abby's Planchette | 40 |
| 셉의 잃어버린 철퇴 | Seb's Lost Mace | 41 |
| 헤일리의 고데기 | Haley's Iron | 42 |
