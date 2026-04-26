import api from "../api/axios";

export function formatMoney(value) {
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatMoneyWithCurrency(value, currency = "UAH") {
  const symbol = currency === "UAH" ? "₴" : currency;
  return `${formatMoney(value)} ${symbol}`;
}

export function getLocalizedCondition(condition) {
  switch (String(condition || "").trim().toLowerCase()) {
    case "excellent":
      return "Відмінний";
    case "very good":
      return "Дуже хороший";
    case "like new":
      return "Майже новий";
    case "good":
      return "Хороший";
    case "fair":
      return "Задовільний";
    case "new":
      return "Новий";
    default:
      return condition || "Стан уточнюється";
  }
}

export function getLocalizedCategory(category) {
  switch (String(category || "").trim().toLowerCase()) {
    case "clothing":
    case "одяг":
      return "Одяг";
    case "shoes":
    case "взуття":
      return "Взуття";
    case "bags":
    case "сумки":
    case "сумка":
      return "Сумки";
    case "accessories":
    case "аксесуари":
      return "Аксесуари";
    case "outerwear":
      return "Верхній одяг";
    case "shirts":
      return "Сорочки";
    default:
      return category || "Категорія уточнюється";
  }
}

export function getLocalizedSize(size) {
  const value = String(size || "").trim();

  if (!value) return "Розмір уточнюється";
  if (value.toLowerCase() === "one size") return "Універсальний";

  return value;
}

export function normalizeMediaUrl(rawUrl) {
  const value = rawUrl?.trim();

  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;

  const baseUrl = String(api.defaults.baseURL || "").replace(/\/$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;

  return `${baseUrl}${path}`;
}

export function getWalletAmounts(wallet, fallbackProfile) {
  const currency = wallet?.currency || fallbackProfile?.currency || "UAH";
  const balance = Number(wallet?.balance ?? fallbackProfile?.balance ?? 0);
  const lockedBalance = Number(wallet?.lockedBalance ?? fallbackProfile?.lockedBalance ?? 0);
  const availableBalance = Number(
    wallet?.availableBalance ?? fallbackProfile?.availableBalance ?? balance
  );

  return {
    balance,
    lockedBalance,
    availableBalance,
    currency,
  };
}

export function normalizeAuctionEntity(auction) {
  if (!auction || typeof auction !== "object") {
    return null;
  }

  return {
    ...auction,
    id: getAuctionIdentifier(auction),
    images: normalizeAuctionImages(auction.images),
    leader: auction?.leader
      ? { ...auction.leader, avatarUrl: normalizeMediaUrl(auction.leader.avatarUrl) }
      : auction?.leader,
    isFavorite: Boolean(auction?.isFavorite),
    bidCount: Number(auction?.bidCount ?? auction?.bidsCount ?? 0),
  };
}

export function normalizeAccountStatus(status) {
  switch (String(status || "").trim()) {
    case "VIP":
    case "Private":
      return "Private";
    case "Premium":
    case "Elite":
      return "Elite";
    case "Basic":
    case "Member":
    default:
      return "Member";
  }
}

export function getAccountStatusMeta(status) {
  switch (normalizeAccountStatus(status)) {
    case "Private":
      return {
        label: "Private",
        description: "Закритий рівень з ексклюзивними аукціонами та максимальними привілеями",
        tone: "private",
      };
    case "Elite":
      return {
        label: "Elite",
        description: "Розширений рівень з раннім доступом і додатковими можливостями",
        tone: "elite",
      };
    default:
      return {
        label: "Member",
        description: "Базовий рівень з доступом до стандартних аукціонів та участі в торгах",
        tone: "member",
      };
  }
}

export function getAuctionAccessLevelMeta(status) {
  const normalizedStatus = normalizeAccountStatus(status);

  switch (normalizedStatus) {
    case "Private":
      return {
        label: "Private",
        shortLabel: "Private",
        description: "Доступно лише для користувачів рівня Private",
        tone: "private",
      };
    case "Elite":
      return {
        label: "Elite",
        shortLabel: "Elite",
        description: "Доступно для користувачів рівня Elite або Private",
        tone: "elite",
      };
    default:
      return {
        label: "Member",
        shortLabel: "Member",
        description: "Стандартний рівень доступу",
        tone: "member",
      };
  }
}

export function getUserPrivileges(profile) {
  return [
    {
      key: "earlyAccess",
      label: "Ранній доступ",
      value: Boolean(profile?.hasEarlyAccess),
    },
    {
      key: "closedAuctionAccess",
      label: "Доступ до закритих аукціонів",
      value: Boolean(profile?.hasClosedAuctionAccess),
    },
    {
      key: "elevatedLimits",
      label: "Підвищені ліміти",
      value: Boolean(profile?.hasElevatedLimits),
    },
    {
      key: "exclusiveOffers",
      label: "Ексклюзивні пропозиції",
      value: Boolean(profile?.hasExclusiveOffers),
    },
    {
      key: "activeBidLimit",
      label: "Ліміт активних ставок",
      value: profile?.activeBidLimit ?? "—",
    },
  ];
}

export function getPersonProfile(person, fallbackLabel = "Користувач") {
  const firstName = person?.firstName || "";
  const lastName = person?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const userId = person?.userId || person?.id || "";
  const userName = person?.userName || person?.username || "";
  const avatarUrl = normalizeMediaUrl(person?.avatarUrl || person?.imageUrl || "");
  const displayName = fullName || userName || fallbackLabel;

  return {
    userId,
    userName,
    avatarUrl,
    displayName,
  };
}

export function getAuctionLeaderProfile(auction) {
  return getPersonProfile(auction?.leader || auction?.currentLeader || null, "Лідер ще не визначений");
}

export function getAuctionIdentifier(auction) {
  if (!auction || typeof auction !== "object") {
    return "";
  }

  return auction.id || auction.auctionId || auction?.auction?.id || auction?.auction?.auctionId || "";
}

export function getBidderProfile(bid) {
  const nestedUser =
    bid?.bidder ||
    bid?.user ||
    bid?.participant ||
    bid?.profile ||
    bid?.author ||
    null;

  return getPersonProfile(
    {
      userId: nestedUser?.userId || nestedUser?.id || bid?.userId || bid?.bidderId,
      userName:
        nestedUser?.userName ||
        nestedUser?.username ||
        bid?.userName ||
        bid?.username ||
        bid?.bidderUserName ||
        bid?.bidderUsername,
      firstName:
        nestedUser?.firstName ||
        bid?.firstName ||
        bid?.bidderFirstName ||
        bid?.userFirstName,
      lastName:
        nestedUser?.lastName ||
        bid?.lastName ||
        bid?.bidderLastName ||
        bid?.userLastName,
      avatarUrl:
        nestedUser?.avatarUrl ||
        bid?.avatarUrl ||
        bid?.bidderAvatarUrl ||
        bid?.userAvatarUrl,
    },
    "Користувач"
  );
}

export function normalizeBidEntity(bid) {
  return {
    ...bid,
    bidder: getBidderProfile(bid),
  };
}

export function getAuctionImage(auction) {
  if (!auction?.images?.length) return "";

  const image = auction.images[0];
  return normalizeMediaUrl(image?.imageUrl || image?.url || "");
}

export function normalizeAuctionImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .map((image, index) => ({
      ...image,
      id: image?.id || `${index}`,
      imageUrl: normalizeMediaUrl(image?.imageUrl || image?.url || ""),
    }))
    .filter((image) => image.imageUrl);
}

export function getDeliveryStatusLabel(status) {
  switch (String(status || "")) {
    case "Pending":
      return "Очікується";
    case "Requested":
      return "Запитано";
    case "InTransit":
      return "У дорозі";
    case "Delivered":
      return "Доставлено";
    default:
      return status || "Очікується";
  }
}
