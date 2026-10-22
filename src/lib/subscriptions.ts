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
 * Редактируйте цены здесь
 * =============================================
 */
export const SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: "gpu-1",
    name: "Xbox Game Pass Ultimate",
    duration: "1 Месяц",
    price: 990,
    description: "Для новых и старых аккаунтов",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-3",
    name: "Xbox Game Pass Ultimate",
    duration: "3 Месяца",
    price: 2650,
    description: "Самый популярный выбор",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
    isPopular: true,
  },
  {
    id: "gpu-5",
    name: "Xbox Game Pass Ultimate",
    duration: "5 Месяцев",
    price: 3450,
    description: "Выгодное предложение",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "gpu-12",
    name: "Xbox Game Pass Ultimate",
    duration: "12 Месяцев",
    price: 7490,
    description: "Максимальная экономия",
    features: ["Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
];

/**
 * =============================================
 * ПОДПИСКИ НА НОВЫЙ АККАУНТ
 * Редактируйте цены здесь
 * =============================================
 */
export const SUBSCRIPTIONS_NEW: SubscriptionPlan[] = [
  {
    id: "new-1",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "1 Месяц",
    price: 690,
    description: "Создадим аккаунт и активируем",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-3",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "3 Месяца",
    price: 1890,
    description: "Оптимальный старт",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
    isPopular: true,
  },
  {
    id: "new-5",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "5 Месяцев",
    price: 2890,
    description: "Надолго и выгодно",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
  {
    id: "new-12",
    name: "Game Pass Ultimate · Новый аккаунт",
    duration: "12 Месяцев",
    price: 5990,
    description: "Лучшая цена за год",
    features: ["Новый аккаунт Microsoft", "Game Pass для консолей", "Game Pass для ПК", "EA Play", "Xbox Live Gold"],
  },
];

/**
 * =============================================
 * ПОДПИСКИ PLAYSTATION (PS PLUS / EA PLAY)
 * Редактируйте цены здесь
 * =============================================
 */
export const SUBSCRIPTIONS_PS: SubscriptionPlan[] = [
  {
    id: "ps-ess-12",
    name: "PS Plus Essential",
    duration: "12 Месяцев",
    price: 6450,
    description: "Базовая подписка (Online + Игры месяца)",
    features: ["Online Multiplier", "Cloud Storage", "Monthly Games", "Exclusive Discounts"],
  },
  {
    id: "ps-extra-12",
    name: "PS Plus Extra",
    duration: "12 Месяцев",
    price: 9850,
    description: "Огромный каталог игр (Сотни тайтлов)",
    features: ["Каталог игр PS4/PS5", "Ubisoft+ Classics", "Все функции Essential"],
    isPopular: true,
  },
  {
    id: "ps-del-12",
    name: "PS Plus Deluxe",
    duration: "12 Месяцев",
    price: 11200,
    description: "Максимальная подписка с классикой",
    features: ["Каталог классики", "Пробные версии игр", "Все функции Extra"],
  },
  {
    id: "ps-ea-12",
    name: "EA Play (PlayStation)",
    duration: "12 Месяцев",
    price: 3890,
    description: "Библиотека игр Electronic Arts",
    features: ["Игры EA (FC 24, UFC и др.)", "Скидки 10% на контент", "Ранний доступ"],
  },
];
