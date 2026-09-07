export default function AvatarName({
  name = "User",
  size = 42,
}) {
  const cleanName =
    String(name || "").trim() || "User";


  const initials = cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");


  return (
    <div
      className="avatar-name"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        fontSize: `${Math.max(
          12,
          size * 0.36
        )}px`,
      }}
      title={cleanName}
      aria-label={`${cleanName} avatar`}
    >
      {initials || "U"}
    </div>
  );
}