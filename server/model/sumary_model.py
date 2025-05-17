from transformers import PreTrainedTokenizerFast, BartForConditionalGeneration
#pip install transformers

# Load Model and Tokenizer
tokenizer = PreTrainedTokenizerFast.from_pretrained("EbanLee/kobart-summary-v3")
model = BartForConditionalGeneration.from_pretrained("EbanLee/kobart-summary-v3")

# Encoding
input_text = "10년 논란 끝에 밑글씨까지 새기고 제작 완료를 눈앞에 둔 ‘광화문 현판’을 원점에서 재검토해 한글 현판으로 교체하자는 주장이 문화계 명사들이 포함된 자칭 ‘시민모임’에서 나왔다.\n  이들은 문화재청이 지난해 8월 최종 확정한 복원안이 시민 의견과 시대정신을 반영한 것이 아니라면서 오는 한글날까지 대대적인 현판 교체 시민운동을 벌이겠다고 예고했다.\n  ‘광화문 현판 훈민정음체로 시민모임’(공동대표 강병인‧한재준, 이하 ‘시민모임’)에 이름을 올린 문화예술인은 현재까지 총 24명.\n  이 중엔 2014~2016년 서울시 총괄건축가를 지낸 승효상 이로재 대표와 ‘안상수체’로 유명한 안상수 파주타이포그라피학교 교장, 유영숙 전 환경부장관(세종사랑방 회장), 임옥상 미술가 등이 있다.\n  공동대표인 강병인 작가는 ‘참이슬’ ‘화요’ 등의 상표 글씨로 유명한 캘리그라피(서체) 작가다.\n  ‘시민모임’은 14일 오후 서울 종로구의 한 서점에서 기자간담회를 열고 이 같은 입장과 함께 훈민정음 해례 글자꼴로 시범 제작한 모형 현판(1/2 크기 축소판)도 공개할 예정이다.\n  강 공동대표는 13일 기자와 통화에서 “새 현판 제작 과정에서 한글로 만들자는 의견은 묵살됐다”면서 “지난해 8월 이후 문화재청에 거듭 입장을 전했지만 반영되지 않아 시민운동에 나서기로 했다”고 말했다.\n  일단 문화예술인 주축으로 꾸렸지만 조만간 한글협회 등 한글 관련단체들과 연대한다는 방침이다.\n  이들이 배포한 사전자료엔 ^한자현판 설치는 중국의 속국임을 표시하는 것으로 대한민국 정체성에 도움이 되지 않고 ^광화문은 21세기의 중건이지 복원이 아니므로 당대의 시대정신인 한글로 현판을 써야하며 ^한글현판은 미래에 남겨줄 우리 유산을 재창조한다는 의미라는 주장이 담겼다.\n  현재 광화문 현판에 대해선 “고종이 경복궁을 중건할 때 당시 훈련대장이던 임태영이 쓴 광화문 현판의 글씨를 조그만 사진에서 스캐닝하고 이를 다듬어 이명박정부 때 설치된 것”이라면서 복원 기준으로서의 정당성을 깎아내렸다.\n    ‘시민모임’에 참여한 승효상 대표도 개인의견을 전제로 “현판을 꼭 한가지만 고집할 필요도 없다.\n  매년 교체할 수도 있고, 광장에서 보이는 정면엔 한글현판, 반대편엔 한자현판을 다는 아이디어도 가능한 것 아니냐”고 말했다.\n  그러면서 “문화재 전문가들은 보수적일 수밖에 없지만 현판이란 게 요즘 말로는 ‘간판’인데 새 시대에 맞게 바꿔 다는 게 바람직하다”고 주장했다.\n"
inputs = tokenizer(input_text, return_tensors="pt", padding="max_length", truncation=True, max_length=1026)

# Generate Summary Text Ids
summary_text_ids = model.generate(
input_ids=inputs['input_ids'],
attention_mask=inputs['attention_mask'],
bos_token_id=model.config.bos_token_id,
eos_token_id=model.config.eos_token_id,
length_penalty=1.0,
max_length=300,
min_length=12,
num_beams=6,
repetition_penalty=1.5,
no_repeat_ngram_size=15,
)

# Decoding Text Ids
result = tokenizer.decode(summary_text_ids[0], skip_special_tokens=True)
