export function buildNoticeUrl(pathname: string, notice: string) {
  const separator = pathname.includes("?") ? "&" : "?";
  const noticeParam = `notice=${encodeURIComponent(notice)}`;
  const noticeIdParam = `noticeId=${Date.now()}`;

  return `${pathname}${separator}${noticeParam}&${noticeIdParam}`;
}
