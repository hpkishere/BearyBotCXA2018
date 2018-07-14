const determineISOCode = (language) => {
  switch (language) {
    case "Indonesian":
      return "id";
    case "Tagalog":
      return "tl";
    case "Vietnamese":
      return "vi";
    case "Malay":
      return "ms";
    case "Mandarin":
      return "zh";
    case "Thai":
      return "th";
  }
}

export default determineISOCode;