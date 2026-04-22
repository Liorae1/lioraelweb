function toTimestamp(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getAuctionPhase(auction, now = Date.now()) {
  const normalizedStatus = String(auction?.status || "").toLowerCase();
  const startTime = toTimestamp(auction?.startTime);
  const endTime = toTimestamp(auction?.endTime);

  if (["finished", "closed", "completed", "ended", "cancelled", "canceled"].includes(normalizedStatus)) {
    return "closed";
  }

  if (normalizedStatus === "draft" || (startTime && startTime > now)) {
    return "planned";
  }

  if (endTime && endTime <= now) {
    return "closed";
  }

  return "active";
}

export function getAuctionStatusLabel(auction, now = Date.now()) {
  const phase = getAuctionPhase(auction, now);

  if (phase === "active") return "Активний";
  if (phase === "planned") return "Запланований";
  if (phase === "closed") return "Завершений";

  return "Лот";
}

export function getAuctionTimeLabel(auction, now = Date.now()) {
  const phase = getAuctionPhase(auction, now);

  if (phase === "planned") return "Стартує через";
  if (phase === "active") return "Завершиться через";

  return "Статус";
}

export function getAuctionMetaDateLabel(auction, now = Date.now()) {
  return getAuctionPhase(auction, now) === "planned" ? "Початок" : "Старт";
}

export function formatAuctionTimeLeft(auction, now = Date.now()) {
  const phase = getAuctionPhase(auction, now);
  const targetValue = phase === "planned" ? auction?.startTime : auction?.endTime;
  const target = toTimestamp(targetValue);

  if (phase === "closed") {
    return "Торги завершено";
  }

  if (!target) {
    return "Дата уточнюється";
  }

  const diff = target - now;

  if (diff <= 0) {
    return phase === "planned" ? "Стартує зараз" : "Завершується зараз";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days} д ${hours} год`;
  if (hours > 0) return `${hours} год ${minutes} хв`;
  if (minutes > 0) return `${minutes} хв`;

  return "Менше хвилини";
}

export function sortAuctionsForHomepage(auctions, now = Date.now()) {
  return [...auctions].sort((first, second) => {
    const firstPhase = getAuctionPhase(first, now);
    const secondPhase = getAuctionPhase(second, now);

    const firstPriority =
      firstPhase === "active" ? 0 : firstPhase === "planned" ? 1 : 2;
    const secondPriority =
      secondPhase === "active" ? 0 : secondPhase === "planned" ? 1 : 2;

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    const firstAnchor =
      firstPhase === "planned"
        ? toTimestamp(first?.startTime)
        : firstPhase === "active"
          ? toTimestamp(first?.endTime)
          : toTimestamp(first?.endTime) || toTimestamp(first?.updatedAt);

    const secondAnchor =
      secondPhase === "planned"
        ? toTimestamp(second?.startTime)
        : secondPhase === "active"
          ? toTimestamp(second?.endTime)
          : toTimestamp(second?.endTime) || toTimestamp(second?.updatedAt);

    return (firstAnchor || Number.MAX_SAFE_INTEGER) - (secondAnchor || Number.MAX_SAFE_INTEGER);
  });
}
