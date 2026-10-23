export interface CollectionCard {
  id: string;
  title: string;
  price: string;
  note?: string;
  discount: string;
  platforms: string[];
  cover: string;
  collection: string;
}

/**
 * ============================================================
 * ПОДБОРКИ ОТ МАГАЗИНА
 * Добавляйте и редактируйте карточки здесь
 * ============================================================
 */
export const COLLECTION_CARDS: CollectionCard[] = [
  {
    id: "elden-nightreign",
    title: "ELDEN RING NIGHTREIGN",
    price: "2641 ₽",
    note: "Мрачное фэнтези и кооперативные забеги",
    discount: "−30%",
    platforms: ["Xbox One", "Xbox Series X|S"],
    cover: "./covers/eldenring.jpg",
    collection: "Soulslike",
  },
  {
    id: "wukong",
    title: "BLACK MYTH: WUKONG",
    price: "3267 ₽",
    note: "Эпичные боссы и китайская мифология",
    discount: "−25%",
    platforms: ["Xbox Series X|S"],
    cover: "./covers/wukong.jpg",
    collection: "Soulslike",
  },
  {
    id: "rdr2",
    title: "RED DEAD REDEMPTION 2",
    price: "1690 ₽",
    note: "Большой открытый мир и лучший вестерн",
    discount: "−45%",
    platforms: ["Xbox One", "Xbox Series X|S"],
    cover: "./covers/rdr2.jpg",
    collection: "Открытый мир",
  },
  {
    id: "gta5",
    title: "GRAND THEFT AUTO V",
    price: "2408 ₽",
    note: "Классика Лос-Сантоса и море контента",
    discount: "−35%",
    platforms: ["Xbox One", "Xbox Series X|S"],
    cover: "./covers/gta.jpg",
    collection: "Открытый мир",
  },
  {
    id: "hogwarts",
    title: "HOGWARTS LEGACY DELUXE",
    price: "1327 ₽",
    note: "Магический мир Хогвартса и приключения",
    discount: "−40%",
    platforms: ["Xbox One", "Xbox Series X|S"],
    cover: "./covers/hogwarts.jpg",
    collection: "Открытый мир",
  },
  {
    id: "bg3",
    title: "BALDUR'S GATE 3 DELUXE",
    price: "3794 ₽",
    note: "Одна из лучших RPG последних лет",
    discount: "−33%",
    platforms: ["Xbox Series X|S"],
    cover: "./covers/bg3.jpg",
    collection: "RPG",
  },
  {
    id: "it-takes-two",
    title: "IT TAKES TWO",
    price: "1297 ₽",
    note: "Идеальная игра для совместного прохождения",
    discount: "−15%",
    platforms: ["Xbox One", "Xbox Series X|S"],
    cover: "./covers/hogwarts.jpg",
    collection: "Кооператив",
  },
  {
    id: "diablo4",
    title: "DIABLO IV",
    price: "1527 ₽",
    note: "Лут, сезоны и совместная игра",
    discount: "−18%",
    platforms: ["Xbox One", "Xbox Series X|S"],
    cover: "./covers/wukong.jpg",
    collection: "Кооператив",
  },
  {
    id: "halo-infinite",
    title: "HALO INFINITE",
    price: "2090 ₽",
    note: "Шутер, кампания и мультиплеер",
    discount: "−22%",
    platforms: ["Xbox One", "Xbox Series X|S", "PC"],
    cover: "./covers/eldenring.jpg",
    collection: "Шутеры",
  },
];
