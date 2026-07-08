---
source_name: url2_container_image
root_id: 3749b97b-4888-80a1-8f73-f5871a314a98
block_count: 39
---

# 컨테이너 이미지로 MCP 서버 등록하기

PlayMCP in KC에 MCP 서버를 등록하는 방법 중 컨테이너 이미지를 활용한 등록 방법을 설명합니다.
내가 개발한 MCP 서버를 Docker 이미지로 제작 후 레지스트리에 등록한 후 사용합니다.
아래 순서대로 진행하여 개발하신 MCP서버를 등록하여 URL Endpoint를 받으면 완료입니다.
### 1. PlayMCP in KC 진입

1. 브라우저에서 https://playmcp.kakaocloud.io (https://playmcp.kakaocloud.io/) 로 진입합니다.
2. 카카오 계정 비로그인 상태에서는 로그인을 완료해야만 사이트에 진입할 수 있습니다. 이때 로그인 하는 계정은 PlayMCP 에 가입된 회원의 카카오 계정이어야 합니다.
3. 로그인을 완료하면 아래와 같이 PlayMCP in KC의 홈이 보입니다.
- [image] attachment:2ce7ce52-898e-448c-ac3c-d511b44a9c90:image.png
### 2. 새 MCP 서버 등록

⚠️ 이미지는 linux/amd64 아키텍처로 빌드해야 합니다. Apple Silicon Mac에서는 docker build --platform linux/amd64 … 옵션을 사용하세요. arm64 이미지는 서버 활성화에 실패합니다.
4. “+ 새 MCP 서버 등록” 버튼을 클릭하여 “이미지 등록”을 선택합니다.
  - [image] attachment:7d7decf5-5e3f-48c8-acbb-90a498a1085d:image.png
5. 이미지 등록 팝업이 뜨면 각 항목을 입력합니다.
  - [image] attachment:d464ca47-af39-4639-9857-15d38c4477fa:image.png
- MCP 서버 이름 : PlayMCP in KC 에 보여질 MCP 서버 이름을 입력합니다. 이 이름은 PlayMCP와 무관합니다.
- 설명 : PlayMCP in KC 에 보여질 MCP 서버 설명을 입력 합니다. 이 설명은 PlayMCP와 무관합니다.
- Registry 호스트 : 이미지 파일이 올려져 있는 레지스트리의 호스트 정보를 입력합니다. 도커의 경우 docker.i (http://docker.id)o 이고, 깃헙은 ghcr.io (https://ghcr.io/) 입니다. 사용하시는 이미지 레지스트리에 따라 상이하니, 사용 중인 레지스트리에서 정보를 확인하세요.
- Registry 사용자 : 이미지를 등록한 레지스트리가 public이 아닌 private 인 경우 입력합니다. 레지스트리마다 사용하는 Registry 사용자 이름이 다르니 사용 중인 레지스트리에서 확인하세요.
- Registry 비밀번호 : 이미지를 등록한 레지스트리가 public이 아닌 private 인 경우 입력합니다. 레지스트리마다 사용하는 Registry 비밀번호가 다르니 사용 중인 레지스트리에서 확인하세요.
- image_name : 레지스트리에 등록되어 있는 이미지의 이름을 입력합니다.
- image_tag : 이미지 버전을 입력하시면 됩니다.
### 3. 서버 활성화 및 완료

6. ‘이미지 등록’ 팝업에서 정보를 정상적으로 입력 후 ‘등록하기’를 클릭하면 서버 등록을 시작합니다. Status : Starting 이라고 나오면 잠시 기다립니다. 짧게는 수십 초 길게는 수 분까지 소요될 수 있습니다.
  - [image] attachment:c4cd325c-3c16-4cfd-8023-909a83353bb2:image.png
7. 서버 등록이 정상적으로 완료되면 Status가 Active 로 바뀝니다.
  - [image] attachment:f297e2cb-d20a-46bf-9b48-02d6ee872124:image.png
8. Active 된 서버를 클릭하여 상세 정보를 확인합니다.
  1. 상세 정보에 보시면 Endpoint URL이 있습니다. 이 URL을 복사하여 PlayMCP에 등록할 때 사용하면 됩니다.
  2. ‘중지’ 버튼을 이용해 서버를 일시 중지 시키거나, ‘삭제’ 버튼으로 서버를 삭제할 수도 있습니다.(삭제 후에는 되돌릴 수 없으니 신중히 선택해 주세요)
  3. MCP 서버는 총 2개까지 등록할 수 있습니다.
- [image] attachment:ef94536c-ae36-4699-83b5-99678ddbfe3d:image.png


## Linked pages discovered
- 3749b97b-4888-80a1-8f73-f5871a314a98: 컨테이너 이미지로 MCP 서버 등록하기
- 3749b97b-4888-803b-b90b-ef3ddbcfbcfb: (untitled)
- 21b9b97b-4888-8093-a57c-c2d24e53dc60: 안녕하세요! PlayMCP입니다.

## Text block inventory
- page 3749b97b-4888-80a1-8f73-f5871a314a98: 컨테이너 이미지로 MCP 서버 등록하기
- page 21b9b97b-4888-8093-a57c-c2d24e53dc60: 안녕하세요! PlayMCP입니다.
- text 37d9b97b-4888-806b-abfc-c876e62b8d13: PlayMCP in KC에 MCP 서버를 등록하는 방법 중 컨테이너 이미지를 활용한 등록 방법을 설명합니다.
- text 37d9b97b-4888-8040-95d1-d8f2736c5d16: 내가 개발한 MCP 서버를 Docker 이미지로 제작 후 레지스트리에 등록한 후 사용합니다.
- text 37d9b97b-4888-8021-a143-c82ff097f650: 아래 순서대로 진행하여 개발하신 MCP서버를 등록하여 URL Endpoint를 받으면 완료입니다.
- sub_header 37d9b97b-4888-80bd-a6bb-c9ae1ba88c5f: 1. PlayMCP in KC 진입
- numbered_list 37d9b97b-4888-8088-9f4d-da1e9a72a93e: 브라우저에서 https://playmcp.kakaocloud.io (https://playmcp.kakaocloud.io/) 로 진입합니다.
- numbered_list 37d9b97b-4888-80c2-be4b-dc98a99c9315: 카카오 계정 비로그인 상태에서는 로그인을 완료해야만 사이트에 진입할 수 있습니다. 이때 로그인 하는 계정은 PlayMCP 에 가입된 회원의 카카오 계정이어야 합니다.
- numbered_list 37d9b97b-4888-800d-ad88-da3d01fb312d: 로그인을 완료하면 아래와 같이 PlayMCP in KC의 홈이 보입니다.
- sub_header 37d9b97b-4888-80fd-ab64-d9f33a8f5552: 2. 새 MCP 서버 등록
- text 37d9b97b-4888-80c0-81b9-ed66d9588cd6: ⚠️ 이미지는 linux/amd64 아키텍처로 빌드해야 합니다. Apple Silicon Mac에서는 docker build --platform linux/amd64 … 옵션을 사용하세요. arm64 이미지는 서버 활성화에 실패합니다.
- numbered_list 37d9b97b-4888-80d7-924e-faa156d82200: “+ 새 MCP 서버 등록” 버튼을 클릭하여 “이미지 등록”을 선택합니다.
- numbered_list 37d9b97b-4888-809b-b85b-cecb1803d380: 이미지 등록 팝업이 뜨면 각 항목을 입력합니다.
- bulleted_list 37d9b97b-4888-801d-bf82-eab4b132e12d: MCP 서버 이름 : PlayMCP in KC 에 보여질 MCP 서버 이름을 입력합니다. 이 이름은 PlayMCP와 무관합니다.
- bulleted_list 37d9b97b-4888-8004-b69f-e6ed0407ad56: 설명 : PlayMCP in KC 에 보여질 MCP 서버 설명을 입력 합니다. 이 설명은 PlayMCP와 무관합니다.
- bulleted_list 37d9b97b-4888-8091-ba1b-d79471af4fd4: Registry 호스트 : 이미지 파일이 올려져 있는 레지스트리의 호스트 정보를 입력합니다. 도커의 경우 docker.i (http://docker.id)o 이고, 깃헙은 ghcr.io (https://ghcr.io/) 입니다. 사용하시는 이미지 레지스트리에 따라 상이하니, 사용 중인 레지스트리에서 정보를 확인하세요.
- bulleted_list 37d9b97b-4888-80b9-a69b-d891f3a6154e: Registry 사용자 : 이미지를 등록한 레지스트리가 public이 아닌 private 인 경우 입력합니다. 레지스트리마다 사용하는 Registry 사용자 이름이 다르니 사용 중인 레지스트리에서 확인하세요.
- bulleted_list 37d9b97b-4888-8042-b2da-fe25c962c5ae: Registry 비밀번호 : 이미지를 등록한 레지스트리가 public이 아닌 private 인 경우 입력합니다. 레지스트리마다 사용하는 Registry 비밀번호가 다르니 사용 중인 레지스트리에서 확인하세요.
- bulleted_list 37d9b97b-4888-80a1-8b9e-e13e36fb5534: image_name : 레지스트리에 등록되어 있는 이미지의 이름을 입력합니다.
- bulleted_list 37d9b97b-4888-80d9-b8a4-de01b10fc0f5: image_tag : 이미지 버전을 입력하시면 됩니다.
- sub_header 37d9b97b-4888-807b-ad6a-cab9c1ebe083: 3. 서버 활성화 및 완료
- numbered_list 37d9b97b-4888-80aa-a121-d12762465782: ‘이미지 등록’ 팝업에서 정보를 정상적으로 입력 후 ‘등록하기’를 클릭하면 서버 등록을 시작합니다. Status : Starting 이라고 나오면 잠시 기다립니다. 짧게는 수십 초 길게는 수 분까지 소요될 수 있습니다.
- numbered_list 37d9b97b-4888-80ad-8cfe-f3a923e7c75c: 서버 등록이 정상적으로 완료되면 Status가 Active 로 바뀝니다.
- numbered_list 37d9b97b-4888-806d-99e7-e31705ed8c78: Active 된 서버를 클릭하여 상세 정보를 확인합니다.
- numbered_list 37d9b97b-4888-806c-9985-da869da34ef2: 상세 정보에 보시면 Endpoint URL이 있습니다. 이 URL을 복사하여 PlayMCP에 등록할 때 사용하면 됩니다.
- numbered_list 37d9b97b-4888-8056-b13a-d3e2528d1daf: ‘중지’ 버튼을 이용해 서버를 일시 중지 시키거나, ‘삭제’ 버튼으로 서버를 삭제할 수도 있습니다.(삭제 후에는 되돌릴 수 없으니 신중히 선택해 주세요)
- numbered_list 37d9b97b-4888-8091-85ab-dec999953c74: MCP 서버는 총 2개까지 등록할 수 있습니다.