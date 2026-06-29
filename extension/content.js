(function() {
  // Extract visible, clean text from the active webpage body
  const bodyText = document.body.innerText || "";
  return bodyText.trim();
})();
