export function ThemeScript() {
  const script = `
    (function () {
      try {
        var storageKey = "japanweb-theme";
        var saved = localStorage.getItem(storageKey);
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var isDark = saved ? saved === "dark" : prefersDark;
        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      } catch (error) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
