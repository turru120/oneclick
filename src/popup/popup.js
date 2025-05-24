document.addEventListener("DOMContentLoaded", () => {
    // 요소들 캐싱
    const loginRedirect = document.getElementById("loginRedirect");
    const loginContainer = document.getElementById("login-container");
    const summarizeBtn = document.getElementById("summarizeBtn");
    const resultDiv = document.getElementById("result");
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsContainer = document.getElementById("settings-container");
    const summaryFontSizeInput = document.getElementById("summaryFontSize");
    const summaryOutputFormatSelect = document.getElementById("summaryOutputFormat");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");
    const historyBtn = document.getElementById("historyBtn");

    // 로그인 관련
    if (loginRedirect) {
        loginRedirect.addEventListener("click", () => {
            if (loginContainer.style.display === "none") {
                loginContainer.style.display = "block";
                settingsContainer.style.display = "none";
                resultDiv.textContent = '';
            } else {
                loginContainer.style.display = "none";
            }
        });
    }

    // 환경설정 버튼
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            if (settingsContainer.style.display === "none") {
                settingsContainer.style.display = "block";
                loginContainer.style.display = "none";
                resultDiv.textContent = '';
                loadSettings(); // 설정창 열 때 기존 설정값 불러오기기
            } else {
                settingsContainer.style.display = "none";
            }
        });
    }

    // 환경설정 저장 버튼
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            const fontSize = summaryFontSizeInput.value;
            const outputFormat = summaryOutputFormatSelect.value;
            // chrome.storage.local에 설정값 저장
            chrome.storage.local.set({
                summaryFontSize: fontSize,
                summaryOutputFormat: outputFormat
            }, () => {
                console.log("환경설정 저장 완료:", { fontSize, outputFormat });
                updateResult("설정이 저장되었습니다.");
                setTimeout(() => {
                    resultDiv.textContent = '';
                }, 2000);
            });
        });
    }

    // 환경설정 닫기 버튼
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener("click", () => {
            settingsContainer.style.display = "none";
            resultDiv.textContent = '';
        });
    }

    // 이력조회 버튼
    if (historyBtn) {
        historyBtn.addEventListener("click", () => {
            chrome.tabs.create({
                url: chrome.runtime.getURL("src/history/history.html"),
            });
        });
    }

    // 요약하기 버튼
    if (summarizeBtn) {
        summarizeBtn.addEventListener("click", async () => {
            resultDiv.textContent = '기사 내용을 요약 중입니다... 잠시만 기다려 주세요.';
            // 환경설정 및 로그인 컨테이너 숨기기
            settingsContainer.style.display = 'none';
            loginContainer.style.display = 'none';

            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                console.log("현재 탭:", tab);

                 // --- 탭 유효성 및 크롬 내부 페이지 예외 처리 (사전 검증) ---
                if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                    updateResult("이 페이지는 요약할 수 없습니다.");
                    resultDiv.style.color = 'red';
                    return; // 더 이상 진행하지 않고 함수 종료
                }

                // 유튜브 URL인지 확인 (서버에서 추가 처리 필요 시)
                // YouTube URL은 'http://www.youtube.com/watch' 또는 'https://m.youtube.com/watch' 등 다양한 형식이므로 contains로 확인
                const isYoutube = tab.url.includes("youtube.com/watch") || tab.url.includes("youtu.be/");


                chrome.tabs.sendMessage(tab.id, { action: "getTextAndTitle" }, (response) => {
                    // --- 본문 추출 통신 결과 및 응답 유효성 검사 (실행 후 검증) ---
                    if (chrome.runtime.lastError) {
                        console.error("메시지 전송 오류 또는 content script 오류:", chrome.runtime.lastError);
                        updateResult("페이지 본문 추출 중 오류가 발생했습니다. 확장 프로그램 권한을 확인해주세요.");
                        resultDiv.style.color = 'red';
                        return;
                    }

                    if (!response || !response.text) {
                        console.error("본문 추출 응답이 없거나 텍스트가 비어 있습니다.");
                        updateResult("이 페이지에서 요약할 본문을 찾을 수 없습니다.");
                        resultDiv.style.color = 'red';
                        return;
                    }

                    const url = tab.url;
                    const pageText = response.text;
                    const pageTitle = response.title;

                    console.log("요약 요청 데이터:", {
                        url: url,
                        title: pageTitle,
                        textLength: pageText.length,
                        date: new Date().toISOString(),
                    });

                    // 사용자 설정 가져오기
                    chrome.storage.local.get(
                        ["summaryFontSize", "summaryOutputFormat"],
                        (settings) => {
                            const fontSize = settings.summaryFontSize || 14;     // 기본값
                            const outputFormat = settings.summaryOutputFormat || "inline"; // 기본값

                            sendToServer(url, pageText, fontSize, outputFormat, (summary) => {
                                console.log("서버로부터 받은 요약:", summary);
                                saveHistory(url, pageText, pageTitle, summary);
                            });
                        }
                    );
                });
            } catch (error) {
                console.error("오류 발생:", error);
                updateResult("오류가 발생했습니다.");
            }
        });
    }

    // 결과 메시지 업데이트 함수
    function updateResult(message) {
        const resultDiv = document.getElementById("result");
        if (resultDiv) {
            resultDiv.textContent = message;
        }
    }

    // 서버에 POST 요청 보내는 함수
    function sendToServer(url, text, fontSize, outputFormat, isYoutube, callback) {
        fetch("http://localhost:5000/post_summary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, text, fontSize, isYoutube }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || '요약 서비스 오류 발생');
                    });
                }
                return response.json();
            })
            .then((data) => {
                const summary = data.response || "요약 결과를 받지 못했습니다.";

                //요약 결과를 팝업 또는 인라인으로 표시
                if (outputFormat === "popup") {
                    const popup = window.open("", "summaryPopup", "width=400,height=300");
                    if (popup) {
                        popup.document.body.innerHTML = `<p style="font-size:${fontSize}px;">${summary}</p>`;
                    } else {
                        alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
                        updateResult("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
                    }
                } else {
                    resultDiv.innerHTML = `<p style="font-size:${fontSize}px;">${summary}</p>`;
                }

                if (callback) callback(summary);
            })
            .catch((err) => {
                console.error("서버 오류:", err);
                updateResult(`서버 요청 중 오류가 발생했습니다: ${err.message}`);
            });
    }

    // 환경설정 불러오기
    function loadSettings() {
        chrome.storage.local.get(
            ["summaryFontSize", "summaryOutputFormat"],
            (settings) => {
                summaryFontSizeInput.value = settings.summaryFontSize || 14;
                summaryOutputFormatSelect.value = settings.summaryOutputFormat || "inline";
                console.log("환경설정 로드 완료:", settings);
            }
        );
    }

    //이력 날짜순 정렬 저장
    function saveHistory(url, text, title, summary) {
        const today = new Date().toISOString();

        chrome.storage.local.get(["summaryHistory"], (result) => {
            const historyArray = result.summaryHistory || [];

            const newEntry = {
                url,
                text,
                title,
                summary,
                date: today,
            };

            historyArray.unshift(newEntry);

            // 최신 날짜 순으로 정렬
            historyArray.sort((a, b) => new Date(b.date) - new Date(a.date));

            chrome.storage.local.set({ summaryHistory: historyArray }, () => {
                console.log("요약 이력 저장 완료");
            });
        });
    }
});