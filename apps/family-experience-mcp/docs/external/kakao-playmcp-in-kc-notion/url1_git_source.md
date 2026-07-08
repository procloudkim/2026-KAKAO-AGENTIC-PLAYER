---
source_name: url1_git_source
root_id: 3749b97b-4888-809d-8f07-eb0f008a252c
block_count: 37
---

# Git 소스로 MCP 서버 등록하기

PlayMCP in KC에 MCP 서버를 등록하는 방법 중 Git 소스를 활용한 등록 방법을 설명합니다.
내가 개발한 MCP 서버의 소스코드가 GitHub 같은 Git 저장소에 올려져 있을 때 사용합니다.
아래 순서대로 진행하여 개발하신 MCP서버를 등록하여 URL Endpoint를 받으면 완료입니다.
### 1. PlayMCP in KC 진입

1. 브라우저에서 https://playmcp.kakaocloud.io (https://playmcp.kakaocloud.io/) 로 진입합니다.
2. 카카오 계정 비로그인 상태에서는 로그인을 완료해야만 사이트에 진입할 수 있습니다. 이때 로그인 하는 계정은 PlayMCP 에 가입된 회원의 카카오 계정이어야 합니다.
3. 로그인을 완료하면 아래와 같이 PlayMCP in KC의 홈이 보입니다.
- [image] attachment:2ce7ce52-898e-448c-ac3c-d511b44a9c90:image.png
### 2. 새 MCP 서버 등록

4. “+ 새 MCP 서버 등록” 버튼을 클릭하여 “Git 소스 빌드”를 선택합니다.
  - [image] attachment:791769b5-ed76-4563-bd96-f061b9c622d9:image.png
5. Git 소스 빌드 팝업이 뜨면 각 항목을 입력합니다.
  - [image] attachment:0ef847a0-ad9a-406b-812f-b4e5d2638491:image.png
- MCP 서버 이름 : PlayMCP in KC 에 보여질 MCP 서버 이름을 입력합니다. 이 이름은 PlayMCP와 무관합니다.
- 설명 : PlayMCP in KC 에 보여질 MCP 서버 설명을 입력 합니다. 이 설명은 PlayMCP와 무관합니다.
- Git URL : Git 소스코드가 올려져 있는 저장소의 주소를 입력합니다. 저장소 루트(또는 지정한 Dockerfile 경로)에 Dockerfile이 반드시 포함되어 있어야 합니다.
- 브랜치 / ref : 특별한 브랜치를 지정할 때 사용합니다. 보통은 main 을 사용합니다.
- Dockerfile 경로 (선택) : Dockerfile 경로가 기본 위치가 아닌 경우 입력합니다. 보통은 Dockerfile 로 두시면 됩니다.
- PAT (선택) : 깃 저장소(깃헙)가 public이 아닌 private 이라면 Personal Access Token 을 입력해야 합니다. 깃헙 기준으로 깃헙에서 "프로필 -> Settings -> Developer settings -> Personal access tokens"에서 토큰을 발급받으실 수 있습니다. PAT 발급 위치는 깃 저장소마다 다르므로 사용 중에 깃 저장소를 참고하세요. private이 아닌 public 저장소라면 비워두시면 됩니다.
### 3. 서버 활성화 및 완료

6. ‘Git 소스 빌드’ 팝업에서 정보를 정상적으로 입력 후 ‘등록하기’를 클릭하면 서버 등록을 시작합니다. Status : Starting 이라고 나오면 잠시 기다립니다. 짧게는 수십 초 길게는 수 분까지 소요될 수 있습니다.
  - [image] attachment:c4cd325c-3c16-4cfd-8023-909a83353bb2:image.png
7. 서버 등록이 정상적으로 완료되면 Status가 Active 로 바뀝니다.
  - [image] attachment:f297e2cb-d20a-46bf-9b48-02d6ee872124:image.png
8. Active 된 서버를 클릭하여 상세 정보를 확인합니다.
  1. 상세 정보에 보시면 Endpoint URL이 있습니다. 이 URL을 복사하여 PlayMCP에 등록할 때 사용하면 됩니다.
  2. ‘중지’ 버튼을 이용해 서버를 일시 중지 시키거나, ‘삭제’ 버튼으로 서버를 삭제할 수도 있습니다.(삭제 후에는 되돌릴 수 없으니 신중히 선택해 주세요)
  3. MCP 서버는 최대 2개까지 등록할 수 있습니다.
- [image] attachment:ef94536c-ae36-4699-83b5-99678ddbfe3d:image.png


## Linked pages discovered
- 3749b97b-4888-809d-8f07-eb0f008a252c: Git 소스로 MCP 서버 등록하기
- 3749b97b-4888-803b-b90b-ef3ddbcfbcfb: (untitled)
- 21b9b97b-4888-8093-a57c-c2d24e53dc60: 안녕하세요! PlayMCP입니다.

## Text block inventory
- page 3749b97b-4888-809d-8f07-eb0f008a252c: Git 소스로 MCP 서버 등록하기
- page 21b9b97b-4888-8093-a57c-c2d24e53dc60: 안녕하세요! PlayMCP입니다.
- text 37d9b97b-4888-801d-b757-c64adca40fc0: PlayMCP in KC에 MCP 서버를 등록하는 방법 중 Git 소스를 활용한 등록 방법을 설명합니다.
- text 37d9b97b-4888-80e9-9d1a-c0582ada859c: 내가 개발한 MCP 서버의 소스코드가 GitHub 같은 Git 저장소에 올려져 있을 때 사용합니다.
- text 37d9b97b-4888-8024-83e3-dc0c9a0fa77f: 아래 순서대로 진행하여 개발하신 MCP서버를 등록하여 URL Endpoint를 받으면 완료입니다.
- sub_header 37d9b97b-4888-8026-884d-e89218ae55c9: 1. PlayMCP in KC 진입
- numbered_list 37d9b97b-4888-807d-a170-d28a66652ddd: 브라우저에서 https://playmcp.kakaocloud.io (https://playmcp.kakaocloud.io/) 로 진입합니다.
- numbered_list 37d9b97b-4888-80ea-8107-fe2367f77a71: 카카오 계정 비로그인 상태에서는 로그인을 완료해야만 사이트에 진입할 수 있습니다. 이때 로그인 하는 계정은 PlayMCP 에 가입된 회원의 카카오 계정이어야 합니다.
- numbered_list 37d9b97b-4888-803f-b599-df11555ee087: 로그인을 완료하면 아래와 같이 PlayMCP in KC의 홈이 보입니다.
- sub_header 37d9b97b-4888-8049-9c8b-fc68d9da9389: 2. 새 MCP 서버 등록
- numbered_list 37d9b97b-4888-80de-b731-eaf745c163e0: “+ 새 MCP 서버 등록” 버튼을 클릭하여 “Git 소스 빌드”를 선택합니다.
- numbered_list 37d9b97b-4888-8070-978f-edc45fc62d5c: Git 소스 빌드 팝업이 뜨면 각 항목을 입력합니다.
- bulleted_list 37d9b97b-4888-8051-82c7-e88b5a24f266: MCP 서버 이름 : PlayMCP in KC 에 보여질 MCP 서버 이름을 입력합니다. 이 이름은 PlayMCP와 무관합니다.
- bulleted_list 37d9b97b-4888-80f5-8e21-d756df6afdca: 설명 : PlayMCP in KC 에 보여질 MCP 서버 설명을 입력 합니다. 이 설명은 PlayMCP와 무관합니다.
- bulleted_list 37d9b97b-4888-803e-93e1-c1d971675821: Git URL : Git 소스코드가 올려져 있는 저장소의 주소를 입력합니다. 저장소 루트(또는 지정한 Dockerfile 경로)에 Dockerfile이 반드시 포함되어 있어야 합니다.
- bulleted_list 37d9b97b-4888-80eb-aa18-da7748e431a1: 브랜치 / ref : 특별한 브랜치를 지정할 때 사용합니다. 보통은 main 을 사용합니다.
- bulleted_list 37d9b97b-4888-8038-8776-c7fa39708c24: Dockerfile 경로 (선택) : Dockerfile 경로가 기본 위치가 아닌 경우 입력합니다. 보통은 Dockerfile 로 두시면 됩니다.
- bulleted_list 37d9b97b-4888-800d-b4f7-e400c50674d4: PAT (선택) : 깃 저장소(깃헙)가 public이 아닌 private 이라면 Personal Access Token 을 입력해야 합니다. 깃헙 기준으로 깃헙에서 "프로필 -> Settings -> Developer settings -> Personal access tokens"에서 토큰을 발급받으실 수 있습니다. PAT 발급 위치는 깃 저장소마다 다르므로 사용 중에 깃 저장소를 참고하세요. private이 아닌 public
- sub_header 37d9b97b-4888-80ee-b90f-e880b2508f01: 3. 서버 활성화 및 완료
- numbered_list 37d9b97b-4888-80a7-ad4d-edc4c6c3661b: ‘Git 소스 빌드’ 팝업에서 정보를 정상적으로 입력 후 ‘등록하기’를 클릭하면 서버 등록을 시작합니다. Status : Starting 이라고 나오면 잠시 기다립니다. 짧게는 수십 초 길게는 수 분까지 소요될 수 있습니다.
- numbered_list 37d9b97b-4888-802b-99d3-ec05899668a4: 서버 등록이 정상적으로 완료되면 Status가 Active 로 바뀝니다.
- numbered_list 37d9b97b-4888-800c-9b6f-ce886c58c111: Active 된 서버를 클릭하여 상세 정보를 확인합니다.
- numbered_list 37d9b97b-4888-802f-bc9c-f3447e2e5a8c: 상세 정보에 보시면 Endpoint URL이 있습니다. 이 URL을 복사하여 PlayMCP에 등록할 때 사용하면 됩니다.
- numbered_list 37d9b97b-4888-8000-b6b6-e1c8e95979d1: ‘중지’ 버튼을 이용해 서버를 일시 중지 시키거나, ‘삭제’ 버튼으로 서버를 삭제할 수도 있습니다.(삭제 후에는 되돌릴 수 없으니 신중히 선택해 주세요)
- numbered_list 37d9b97b-4888-805f-8728-c3200ce94372: MCP 서버는 최대 2개까지 등록할 수 있습니다.