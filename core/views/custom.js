import chalk from "chalk";
import gradient from "gradient-string";

const themes = {
  galaxy: gradient(["#1B263B", "#6B7280", "#9D4EDD", "#C77DFF"]),
  aqua: gradient(["#00A8CC", "#48CAE4", "#90E0EF", "#ADE8F4"]),
  hacker: gradient(["#0D1B2A", "#1B263B", "#00FF00", "#40C057"]),
  flame: gradient(["#FF4500", "#FF6347", "#FFD700", "#FFA500"]),
  rose: gradient(["#FF69B4", "#FF8C94", "#FFC1CC", "#FFE4E1"]),
  sunflower: gradient(["#FFC107", "#FFCA28", "#FFD54F", "#FFECB3"]),
  default: gradient(["#4B5EAA", "#7B9FE7"]),
};

export function log(category, message, theme = "aqua") {
  const selectedGradient = themes[theme.toLowerCase()] || themes.default;
  const colorizedCategory = chalk.bold(selectedGradient(` ${category} `));
  console.log(`${colorizedCategory} ${message}`);
}