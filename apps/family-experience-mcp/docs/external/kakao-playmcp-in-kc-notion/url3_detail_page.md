---
source_name: url3_detail_page
root_id: 3749b97b-4888-806b-8564-ee264e2fafde
block_count: 55
---

# Agentic Player 10 공모전 참가 방법

#### Agentic Player 10 공모전

1. Agentic Player 10 (https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10)은 직접 개발한 MCP서버를 PlayMCP에 등록하여 참가하는 공모전입니다.
2. 공모전 예선 참가를 위해서는 반드시 카카오 클라우드가 제공하는 PlayMCP in KC(MCP 서버 배포 서비스)를 이용하여 MCP 서버를 등록해야 합니다.
3. 공모전은 2026년 6월 15일부터 7월 14일까지 예선 응모를 할 수 있으며, 공모전에 관한 자세한 일정은 공모전 페이지 (https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10)에서 확인해 주세요.
### 공모전 참가 진행 순서

아래 순서를 차례로 진행하여 공모전 예선에 참여하세요.
#### 1. MCP 서버 개발

4. 반드시 PlayMCP에서 제공하는 개발가이드 (https://kko.to/PlayMCPdevguide)를 준수하여 MCP 서버를 개발합니다.
5. 처음 개발은 로컬 환경에서 진행하시는 것을 추천합니다.
6. 로컬 환경에서 모든 테스트 및 개발을 완료합니다.
#### 2. PlayMCP in KC 에서 MCP 서버 배포 (필수)

7. 카카오는 Agentic Player 10 예선 참가를 하실때 사용할 수 있는 PlayMCP in KC(MCP 서버 클라우드)를 무상으로 제공합니다. 개인 별도 서버나 클라우드로 참여하실 수 없으며 반드시 PlayMCP in KC 에 배포된 MCP 서버로 공모전에 참여하여야 합니다.
8. PlayMCP in KC 이용 가이드 (https://pineapple-cub-4dd.notion.site/3749b97b488880a58d90ff614ea361d4?source=copy_link)를 참고하여 MCP Endpoint URL 을 획득합니다.
  1. MCP 서버 클라우드는 PlayMCP in KC 라는 별도 서비스를 통해 이용하실 수 있습니다.
  2. Git 소스 (/p/3749b97b4888809d8f07eb0f008a252c?pvs=25) 또는 컨테이너 이미지 (/p/3749b97b488880a18f73f5871a314a98?pvs=25)로 MCP서버를 생성할 수 있습니다.
#### 3. PlayMCP에 MCP 서버 등록

9. PlayMCP (https://playmcp.kakao.com/)에 회원 가입 및 로그인 합니다.
10. 개발자 콘솔 (https://playmcp.kakao.com/console)에서 “새로운 MCP 서버 등록”을 클릭하여 정보를 입력합니다.
  3. MCP Endpoint 항목에 PlayMCP in KC에서 발급된 Endpoint URL을 입력한 후 “정보 불러오기”를 클릭합니다.
  4. 이때 정보 불러오기가 성공해야 합니다. 만약 실패하였다면 개발한 MCP에 문제가 있는 것입니다.
11. 정보 입력 후 반드시 “임시 등록”을 클릭합니다. (지금은 ”등록 및 심사요청”을 클릭하지 마세요.)
  - [image] attachment:e96d8a88-6c73-48ce-a243-66a3a6cfe645:image.png
12. 임시등록된 상태에서 “MCP 상세 미리보기”를 눌러 나오는 팝업에서 “도구함에 추가”를 눌러 도구함에 담습니다.
  - [image] attachment:57bc153b-a878-4d63-a1fa-e44e1ec5ac6b:image.png
  - [image] attachment:89267ed7-f4b9-44fd-bcff-f38d94233302:image.png
13. PlayMCP에서 제공하는 AI채팅을 통해 충분히 테스트 합니다.
14. 모든 테스트가 완료되면 임시 등록 상태의 MCP를 “심사 요청”을 클릭하여 심사 요청합니다.
  - [image] attachment:e6487153-2443-4106-aef2-eecbc524ff46:image.png
#### 4. PlayMCP 심사 진행 후 공개

15. 심사 요청 후 보통 심사 완료까지 통상 영업일 기준 1~2일이 소요됩니다. (최대 영업일 기준 7일까지 소요될 수 있습니다.)
16. 심사가 반려되면 반려 사유와 함께 반려 이메일이 발송됩니다.
  5. 이때 이메일은 카카오계정의 대표이메일로 발송됩니다. 대표 이메일은 PlayMCP에서 “프로필 → 설정 → 내 정보 관리 → 연결된 이메일”에서 확인하실 수 있습니다.
  6. 반려가 되면 다시 임시 저장 상태가 됩니다. 반려 사유를 처리한 후 다시 “심사 요청”을 합니다.
17. 심사가 승인 되면 승인 메일이 발송 됩니다.
  7. PlayMCP 개발자 콘솔에서 MCP 상세 정보를 보시면 공개 상태가 “나에게만 공개”로 되어 있습니다.
  8. 공개 상태를 “전체 공개”로 전환해 주세요.
  9. 심사가 승인되고 전체 공개된 내 MCP의 상세페이지로 이동한 후 브라우저 주소창의 주소를 복사해 주세요. (ex. https://playmcp.kakao.com/mcp/12345678901234567)
#### 5. 공모전 페이지에서 비즈폼을 이용해 예선 접수

18. Agentic Player 10 공모전 페이지 (https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10)로 이동합니다.
19. 공모전 페이지에서 “Player 예선 참여” 버튼을 클릭해 접수 양식을 작성하여 접수 완료 합니다.
  10. 접수 양식에서 2개까지의 MCP서버를 등록하여 참여할 수 있습니다.
20. 공모전 진행에 관해 궁금하신 사항은 카카오 고객센터 (https://cs.kakao.com/)로 문의하여 주시기 바랍니다.


## Linked pages discovered
- 3749b97b-4888-806b-8564-ee264e2fafde: Agentic Player 10 공모전 참가 방법
- 3749b97b-4888-803b-b90b-ef3ddbcfbcfb: (untitled)
- 21b9b97b-4888-8093-a57c-c2d24e53dc60: 안녕하세요! PlayMCP입니다.
- 3749b97b-4888-80a5-8d90-ff614ea361d4: [필독] 공모전 참가 유의사항
- 3749b97b-4888-809d-8f07-eb0f008a252c: Git 소스로 MCP 서버 등록하기
- 3749b97b-4888-80a1-8f73-f5871a314a98: 컨테이너 이미지로 MCP 서버 등록하기

## Text block inventory
- page 3749b97b-4888-806b-8564-ee264e2fafde: Agentic Player 10 공모전 참가 방법
- page 21b9b97b-4888-8093-a57c-c2d24e53dc60: 안녕하세요! PlayMCP입니다.
- sub_sub_header 3749b97b-4888-8067-b7b1-e2c513e4e414: Agentic Player 10 공모전
- numbered_list 3749b97b-4888-8038-bc39-d8ca3d94fd25: Agentic Player 10 (https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10)은 직접 개발한 MCP서버를 PlayMCP에 등록하여 참가하는 공모전입니다.
- numbered_list 3749b97b-4888-8075-b38b-f75d05040ce7: 공모전 예선 참가를 위해서는 반드시 카카오 클라우드가 제공하는 PlayMCP in KC(MCP 서버 배포 서비스)를 이용하여 MCP 서버를 등록해야 합니다.
- numbered_list 3749b97b-4888-80d3-a738-e307d90f1dd1: 공모전은 2026년 6월 15일부터 7월 14일까지 예선 응모를 할 수 있으며, 공모전에 관한 자세한 일정은 공모전 페이지 (https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10)에서 확인해 주세요.
- sub_header 3799b97b-4888-80c7-8e75-f53bac69e2f0: 공모전 참가 진행 순서
- text 3799b97b-4888-80ca-821b-f61febc6e37c: 아래 순서를 차례로 진행하여 공모전 예선에 참여하세요.
- sub_sub_header 3749b97b-4888-80e0-a11d-eb1f588f5d3e: 1. MCP 서버 개발
- numbered_list 37a9b97b-4888-802e-8793-cc2076810995: 반드시 PlayMCP에서 제공하는 개발가이드 (https://kko.to/PlayMCPdevguide)를 준수하여 MCP 서버를 개발합니다.
- numbered_list 3799b97b-4888-80dd-842c-c42fcf4ce3a2: 처음 개발은 로컬 환경에서 진행하시는 것을 추천합니다.
- numbered_list 3799b97b-4888-801c-814e-e2a90772e38e: 로컬 환경에서 모든 테스트 및 개발을 완료합니다.
- sub_sub_header 3799b97b-4888-80a6-a841-f6cac9410eff: 2. PlayMCP in KC 에서 MCP 서버 배포 (필수)
- numbered_list 3749b97b-4888-800a-9707-c8e05997e189: 카카오는 Agentic Player 10 예선 참가를 하실때 사용할 수 있는 PlayMCP in KC(MCP 서버 클라우드)를 무상으로 제공합니다. 개인 별도 서버나 클라우드로 참여하실 수 없으며 반드시 PlayMCP in KC 에 배포된 MCP 서버로 공모전에 참여하여야 합니다.
- numbered_list 3749b97b-4888-8035-9b6a-e34d72431ac0: PlayMCP in KC 이용 가이드 (https://pineapple-cub-4dd.notion.site/3749b97b488880a58d90ff614ea361d4?source=copy_link)를 참고하여 MCP Endpoint URL 을 획득합니다.
- sub_sub_header 3799b97b-4888-806d-b916-d30229734c54: 3. PlayMCP에 MCP 서버 등록
- numbered_list 3799b97b-4888-801e-a379-e25a8b806741: PlayMCP (https://playmcp.kakao.com/)에 회원 가입 및 로그인 합니다.
- numbered_list 3799b97b-4888-808a-b0dc-eb4ca9151196: 개발자 콘솔 (https://playmcp.kakao.com/console)에서 “새로운 MCP 서버 등록”을 클릭하여 정보를 입력합니다.
- numbered_list 3799b97b-4888-80dc-b847-d25e98aefe8c: 정보 입력 후 반드시 “임시 등록”을 클릭합니다. (지금은 ”등록 및 심사요청”을 클릭하지 마세요.)
- numbered_list 3799b97b-4888-808a-86c6-fe401ba8dd69: 임시등록된 상태에서 “MCP 상세 미리보기”를 눌러 나오는 팝업에서 “도구함에 추가”를 눌러 도구함에 담습니다.
- numbered_list 3799b97b-4888-805d-8298-ff60cd1683b3: PlayMCP에서 제공하는 AI채팅을 통해 충분히 테스트 합니다.
- numbered_list 3799b97b-4888-80c8-9ff1-f344aa2c861b: 모든 테스트가 완료되면 임시 등록 상태의 MCP를 “심사 요청”을 클릭하여 심사 요청합니다.
- sub_sub_header 3799b97b-4888-80f5-a60c-dfe980c50b38: 4. PlayMCP 심사 진행 후 공개
- numbered_list 3799b97b-4888-804f-92c1-c9035b0f2e92: 심사 요청 후 보통 심사 완료까지 통상 영업일 기준 1~2일이 소요됩니다. (최대 영업일 기준 7일까지 소요될 수 있습니다.)
- numbered_list 3799b97b-4888-8017-a710-efb4e5e68314: 심사가 반려되면 반려 사유와 함께 반려 이메일이 발송됩니다.
- page 3749b97b-4888-80a5-8d90-ff614ea361d4: [필독] 공모전 참가 유의사항
- numbered_list 3749b97b-4888-8034-892e-fa2c190680d9: MCP 서버 클라우드는 PlayMCP in KC 라는 별도 서비스를 통해 이용하실 수 있습니다.
- numbered_list 3829b97b-4888-8042-a826-ff9425aee991: Git 소스 (/p/3749b97b4888809d8f07eb0f008a252c?pvs=25) 또는 컨테이너 이미지 (/p/3749b97b488880a18f73f5871a314a98?pvs=25)로 MCP서버를 생성할 수 있습니다.
- page 3749b97b-4888-809d-8f07-eb0f008a252c: Git 소스로 MCP 서버 등록하기
- page 3749b97b-4888-80a1-8f73-f5871a314a98: 컨테이너 이미지로 MCP 서버 등록하기
- numbered_list 3799b97b-4888-809e-897b-f4a9543ed023: MCP Endpoint 항목에 PlayMCP in KC에서 발급된 Endpoint URL을 입력한 후 “정보 불러오기”를 클릭합니다.
- numbered_list 3799b97b-4888-802e-9cec-ef5858abd789: 이때 정보 불러오기가 성공해야 합니다. 만약 실패하였다면 개발한 MCP에 문제가 있는 것입니다.
- numbered_list 3799b97b-4888-80d1-a0b1-cdb9c4c46d6e: 이때 이메일은 카카오계정의 대표이메일로 발송됩니다. 대표 이메일은 PlayMCP에서 “프로필 → 설정 → 내 정보 관리 → 연결된 이메일”에서 확인하실 수 있습니다.
- numbered_list 3799b97b-4888-80b1-a247-c807d1bf6a85: 반려가 되면 다시 임시 저장 상태가 됩니다. 반려 사유를 처리한 후 다시 “심사 요청”을 합니다.
- numbered_list 3799b97b-4888-80e4-b154-ceda69503468: 심사가 승인 되면 승인 메일이 발송 됩니다.
- sub_sub_header 3799b97b-4888-8074-ac45-d014c3666c11: 5. 공모전 페이지에서 비즈폼을 이용해 예선 접수
- numbered_list 3799b97b-4888-80f3-a9d8-ce3386ee5712: Agentic Player 10 공모전 페이지 (https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10)로 이동합니다.
- numbered_list 3799b97b-4888-8022-a800-cf3275959d6f: 공모전 페이지에서 “Player 예선 참여” 버튼을 클릭해 접수 양식을 작성하여 접수 완료 합니다.
- numbered_list 3799b97b-4888-807b-84d8-ce837f765a41: 공모전 진행에 관해 궁금하신 사항은 카카오 고객센터 (https://cs.kakao.com/)로 문의하여 주시기 바랍니다.
- numbered_list 3799b97b-4888-801a-a096-c67537ef4ae6: PlayMCP 개발자 콘솔에서 MCP 상세 정보를 보시면 공개 상태가 “나에게만 공개”로 되어 있습니다.
- numbered_list 3799b97b-4888-8032-af98-c52a231f563e: 공개 상태를 “전체 공개”로 전환해 주세요.
- numbered_list 3799b97b-4888-80e6-bba5-e2587f55329a: 심사가 승인되고 전체 공개된 내 MCP의 상세페이지로 이동한 후 브라우저 주소창의 주소를 복사해 주세요. (ex. https://playmcp.kakao.com/mcp/12345678901234567)
- numbered_list 3799b97b-4888-80a7-8801-f43d077d5cfd: 접수 양식에서 2개까지의 MCP서버를 등록하여 참여할 수 있습니다.