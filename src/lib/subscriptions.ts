export interface SubscriptionPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

/**
 * =============================================
 * ПОДПИСКИ НА СВОЙ АККАУНТ
 * Цены можно менять в Google Таблице (лист «Подписки»);
 * числа здесь — запасные, если в таблице цены нет
 * =============================================
 */
export const SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: "gpu-1",
    name: "Game Pass Ultimate",
    duration: "1 мес",
    price: 1390,
    description: "Для новых и старых аккаунтов",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-2",
    name: "Game Pass Ultimate",
    duration: "2 мес",
    price: 2580,
    description: "Для новых и старых аккаунтов",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-3",
    name: "Game Pass Ultimate",
    duration: "3 мес",
    price: 3390,
    description: "Для новых и старых аккаунтов",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-5",
    name: "Game Pass Ultimate",
    duration: "5 мес",
    price: 4890,
    description: "Выгодное предложение",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-7",
    name: "Game Pass Ultimate",
    duration: "7 мес",
    price: 5700,
    description: "Выгодное предложение",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
    isPopular: true,
  },
  {
    id: "gpu-9",
    name: "Game Pass Ultimate",
    duration: "9 мес",
    price: 6590,
    description: "Отличный выбор на полгода+",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-11",
    name: "Game Pass Ultimate",
    duration: "11 мес",
    price: 7890,
    description: "Почти год подписки",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-12",
    name: "Game Pass Ultimate",
    duration: "12 мес",
    price: 8600,
    description: "Максимальная экономия",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-13",
    name: "Game Pass Ultimate",
    duration: "13 мес",
    price: 8900,
    description: "Максимальная экономия",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
];

/**
 * =============================================
 * ПОДПИСКИ НА НОВЫЙ АККАУНТ
 * Цены можно менять в Google Таблице (лист «Подписки»);
 * числа здесь — запасные, если в таблице цены нет
 * =============================================
 */
export const SUBSCRIPTIONS_NEW: SubscriptionPlan[] = [
  {
    id: "new-1",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "1 мес",
    price: 1550,
    description: "Создадим аккаунт и активируем",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-2",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "2 мес",
    price: 1800,
    description: "Создадим аккаунт и активируем",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-4",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "4 мес",
    price: 3550,
    description: "Оптимальный старт",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-6",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "6 мес",
    price: 4900,
    description: "Надолго и выгодно",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
    isPopular: true,
  },
  {
    id: "new-8",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "8 мес",
    price: 5500,
    description: "Надолго и выгодно",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-10",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "10 мес",
    price: 6800,
    description: "Отличный выбор на полгода+",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-12",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "12 мес",
    price: 7900,
    description: "Максимальная экономия",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-13",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "13 мес",
    price: 8700,
    description: "Максимальная экономия",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
];

/**
 * =============================================
 * ПОДПИСКИ PLAYSTATION (PS PLUS / EA PLAY)
 * Цены можно менять в Google Таблице (лист «Подписки»);
 * числа здесь — запасные, если в таблице цены нет
 * =============================================
 */
export const SUBSCRIPTIONS_PS: SubscriptionPlan[] = [
  // ── Essential ──
  {
    id: "ps-ess-1",
    name: "PS Plus Essential",
    duration: "1 мес",
    price: 1390,
    description: "Базовый уровень",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play"],
  },
  {
    id: "ps-ess-3",
    name: "PS Plus Essential",
    duration: "3 мес",
    price: 3600,
    description: "Базовый уровень",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play"],
  },
  {
    id: "ps-ess-12",
    name: "PS Plus Essential",
    duration: "12 мес",
    price: 8950,
    description: "Базовый уровень",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play"],
  },
  // ── Extra ──
  {
    id: "ps-extra-1",
    name: "PS Plus Extra",
    duration: "1 мес",
    price: 1900,
    description: "Расширенный каталог",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play", "Каталог игр", "Классика Ubisoft+"],
  },
  {
    id: "ps-extra-3",
    name: "PS Plus Extra",
    duration: "3 мес",
    price: 5990,
    description: "Расширенный каталог",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play", "Каталог игр", "Классика Ubisoft+"],
    isPopular: true,
  },
  {
    id: "ps-extra-12",
    name: "PS Plus Extra",
    duration: "12 мес",
    price: 13150,
    description: "Расширенный каталог",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play", "Каталог игр", "Классика Ubisoft+"],
  },
  // ── Deluxe ──
  {
    id: "ps-del-1",
    name: "PS Plus Deluxe",
    duration: "1 мес",
    price: 2300,
    description: "Максимальные возможности",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play", "Каталог игр", "Классика Ubisoft+", "Каталог классики", "Пробные версии игр"],
  },
  {
    id: "ps-del-3",
    name: "PS Plus Deluxe",
    duration: "3 мес",
    price: 5500,
    description: "Максимальные возможности",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play", "Каталог игр", "Классика Ubisoft+", "Каталог классики", "Пробные версии игр"],
  },
  {
    id: "ps-del-12",
    name: "PS Plus Deluxe",
    duration: "12 мес",
    price: 14500,
    description: "Максимальные возможности",
    features: ["Игры месяца", "Сетевая многопользовательская игра", "Эксклюзивные скидки", "Эксклюзивные материалы", "Облачное хранилище", "Share Play", "Каталог игр", "Классика Ubisoft+", "Каталог классики", "Пробные версии игр"],
  },
];
