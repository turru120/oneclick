document.addEventListener("DOMContentLoaded", () => {
  console.log("history.js 로드됨");

  chrome.storage.local.get(["summaryHistory"], (result) => {
    let history = result.summaryHistory || [];
     console.log("저장된 이력:", history);

    if (history.length === 0) {
      renderHistory([]);
    } else {
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderHistory(history);
    }
  });

  function renderHistory(history) {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (history.length === 0) {
      list.innerHTML = `<tr><td colspan="4">저장된 이력이 없습니다.</td></tr>`;
      return;
    }

    history.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.title}</td>
        <td><a href="${item.url}" target="_blank">${item.url}</a></td>
        <td>${item.date.slice(0, 10)}</td>
        <td>
          <div id="summary-${index}" class="summary-preview">${item.summary.slice(0, 30)}...</div>
          <button class="toggle-btn" data-index="${index}">▼</button>
        </td>
      `;
      list.appendChild(row);
    });

    // 토글 기능
    document.querySelectorAll(".toggle-btn").forEach(button => {
      button.addEventListener("click", () => {
        const idx = button.getAttribute("data-index");
        const summaryDiv = document.getElementById(`summary-${idx}`);
        const fullText = history[idx].summary;

        if (summaryDiv.classList.contains("expanded")) {
          summaryDiv.textContent = fullText.slice(0, 30) + "...";
          summaryDiv.classList.remove("expanded");
          button.textContent = "▼";
        } else {
          summaryDiv.textContent = fullText;
          summaryDiv.classList.add("expanded");
          button.textContent = "▲";
        }
      });
    });
  }
});
