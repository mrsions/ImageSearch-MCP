# ImageSearch-MCP 사용법

이 프로젝트는 VibeProG 개발자 테스트 플랫폼을 위한 이미지 검색 기능을 제공합니다.

## 주요 도구

*   `search_image`: 다양한 종류의 이미지를 검색하는 통합 도구.

## `search_image` 도구 설명

`search_image` 도구는 Civitai에서 AI로 생성된 이미지를 검색하거나, Iconify에서 아이콘을 검색합니다. 검색된 이미지는 AI로 생성된 그림이며 자유롭게 사용해도 됩니다.

### 매개변수

*   `type`: 필요한 이미지의 분류 (`icon`|`picture`|`background`|`portrait`)
*   `query`: 필요한 이미지의 단어 혹은 프롬프트 등을 입력합니다. 단어 사이는 띄어쓰기로 구분합니다.

### 동작 방식

*   `type`이 `icon`인 경우: Iconify를 사용하여 아이콘을 검색합니다.
*   그 외의 `type` (`picture`, `background`, `portrait`): Civitai를 사용하여 AI 생성 이미지를 검색합니다.

## 사용 시나리오

### 1. AI 생성 이미지 검색 (Civitai)

*   **언제 사용:** 프로젝트에 AI로 생성된 그림, 배경, 인물 사진 등이 필요할 때 사용합니다.
*   **예시:**
    *   "AI로 생성된 고양이 그림을 찾고 싶을 때"
    *   "게임 배경으로 사용할 이미지를 찾을 때"
    *   "웹사이트의 히어로 섹션에 들어갈 인물 초상화가 필요할 때"
*   **사용 방법:** `search_image` 도구의 `type` 매개변수를 `picture`, `background`, `portrait` 등으로 지정하고 `query`에 검색어를 입력합니다.

### 2. 아이콘 검색 (Iconify)

*   **언제 사용:** UI/UX 디자인에 필요한 다양한 벡터 아이콘을 찾을 때 사용합니다.
*   **예시:**
    *   "로그인 버튼에 사용할 아이콘을 찾을 때"
    *   "파일 관리 시스템에 필요한 폴더 아이콘을 찾을 때"
    *   "소셜 미디어 공유 아이콘이 필요할 때"
*   **사용 방법:** `search_image` 도구의 `type` 매개변수를 `icon`으로 지정하고 `query`에 검색어를 입력합니다.

## Agent 사용 가이드

Agent는 사용자의 요청 내용을 분석하여 `search_image` 도구를 호출하며, `type`과 `query` 매개변수를 적절히 설정합니다. 사용자는 필요한 이미지의 종류와 검색어를 명확하게 제시하면 됩니다.

**예시:**

*   "AI로 생성된 판타지 풍경 이미지를 찾아줘." (Agent는 `search_image` 도구를 `type: 'picture'`로 호출)
*   "사용자 프로필 아이콘을 찾아줘." (Agent는 `search_image` 도구를 `type: 'icon'`으로 호출)
*   "배경으로 쓸 추상적인 AI 이미지를 찾아줘." (Agent는 `search_image` 도구를 `type: 'background'`로 호출)
*   "설정 아이콘을 찾아줘." (Agent는 `search_image` 도구를 `type: 'icon'`으로 호출)