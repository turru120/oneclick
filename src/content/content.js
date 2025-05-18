// 페이지 내 본문 텍스트 추출 
function extractPageText() {
    const selectors = ["article", "main", "div", "section"];
    let text = "";

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.length > 500) {
            text = el.innerText.trim();
            break;
        }
    }

    if (!text) {
        text = document.body.innerText.trim();
    }

    return text.length > 200 ? text : "본문을 찾을 수 없습니다.";
}

// 메시지 수신 및 응답
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTextAndTitle") {
        const text = extractPageText();
        const title = document.title || "제목 없음";
        sendResponse({ text, title });
    }
});
