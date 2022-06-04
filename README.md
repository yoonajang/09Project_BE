# 🎯프로젝트 N빵 소개

![image](https://user-images.githubusercontent.com/101075355/171989148-1d40b7bc-8a40-4aab-9fbc-077b2f24d2e2.png)

### 같이 사면 더 이득인 상품을 같이 사고 같이 먹을 수 있다! 


## ❓ 기획 의도
  #### 2+1 행사 상품, 4팩에 만원!하는 반찬이 사고픈데 사놓고 안 쓰고 안 먹고 버리는게 아까워 만든 서비스입니다

  위치기반으로 동네이웃과 함께 생필품,반찬 등을 나눔하고  
  혼자 밥먹기 외로울 때 부를 수 있는 친구 하나 정도 만들 수 있는 따뜻한 플랫폼입니다.
  
* 🤟[N빵 서비스 바로가기](https://nbbang.site/)
* 👀[서비스 시연 및 발표 영상 보러가기](https://youtu.be/BtlWQiGYH0g)

## 👥 팀 소개

Backend

팀원|github
---|---|
장윤아 | https://github.com/moonhjang
오경은 | https://github.com/KYUNGEUNOHH
한재혁 | https://github.com/mulbinbich

## 🗓 프로젝트 기간

* 2022년 4월 22일 ~ 2022년 6월 3일 
  
  
##  아키텍처


<details>
    <summary>아키텍처 바로보기</summary>

<!-- summary 아래 한칸 공백 두고 내용 삽입 -->
![아키텍처](https://user-images.githubusercontent.com/99785621/171987495-7d0f5d0d-7178-4f40-a4e2-07ebc125ca9e.png)



</details>


## ER 다이어그램


<details>
    <summary>ERD 바로보기</summary>

<!-- summary 아래 한칸 공백 두고 내용 삽입 -->
![ERD](https://user-images.githubusercontent.com/99785621/171987402-7f6c4211-c397-4ba2-a8ad-9ce5344e7eda.png)



</details>


# :hammer_and_wrench: 기능설명
<details>
<summary>1. 지도 (Kakao Map)</summary>
  
<div markdown="1">       

- 사용자 위치 기준, 권역별 게시글 확인가능
- 지도 마커 선택 시, 해당 게시글의 상세내용을 보여주며 위치로 이동

![image](https://user-images.githubusercontent.com/100512708/171988121-3ffc2b22-dae7-41c0-bc29-b112eb8d150a.png)

</div>
</details>

<details>
<summary>2. 채팅 (Socket.io)</summary>
  
<div markdown="1">       

- 각 게시물에 따른 채팅방 생성
- 상대방이 채팅 입력 시, '입력중'이라는 상태 확인 가능
- 상대방이 입장/퇴장 시 확인 가능
- 채팅창 상단에 위치 시,  새로운 채팅메세지를 스크롤다운 없이 확인가능

![image](https://user-images.githubusercontent.com/100512708/171988207-3256c153-eaf9-42f5-b757-abc1d6a75ef2.png)

</div>
</details>

<details>
<summary>3. 참가자 추가기능</summary>
  
<div markdown="1">       

- 실시간으로 채팅 참여자 확인 가능
- 방장은 대기자 :left_right_arrow: 거래자로 변경 가능
- 거래자인 경우 취소 가능

![image](https://user-images.githubusercontent.com/100512708/171988415-9339e4d4-bc20-406e-95bf-379063723e38.png)

</div>
</details>

<details>
<summary>4. 알림 (Socket.io)</summary>
  
<div markdown="1">       

- 해당 채팅방에 있지 않거나 오프라인 상태 시, 알림 송신
  * 새로운 메시지 전달 시
  * 해당 게시글에 거래자로 확정 시
  * 거래자가 거래 취소 시
  
![image](https://user-images.githubusercontent.com/100512708/171988502-845617fa-a8b1-4158-8375-f6379601a8b6.png)

</div>
</details>

<details>
<summary>5. 게시글 제목 기준으로 검색 가능</summary>
  
<div markdown="1">       
  
![image](https://user-images.githubusercontent.com/100512708/171988543-e9907e9f-0fd7-450b-82ec-35970639f291.png)

</div>
</details>

<details>
<summary>6. 마이페이지에서 내 정보 조회 기능</summary>
  
- 본인이 작성한 공구 / 참여한 공구 / 찜한 공구 를 확인 가능  
  
<div markdown="1">       
  
<img width="684" alt="스크린샷 2022-06-04 오후 4 08 53" src="https://user-images.githubusercontent.com/100512708/171988813-b64194bd-6067-4684-a7f9-17712af8168d.png">

</div>
</details>

<details>
<summary>7. 마이페이지에서 내 정보 변경 기능</summary>
  
- 닉네임 및 상태메시지 변경 가능
- 회원 탈퇴 기능  
  
<div markdown="1">       
  
<img width="684" alt="스크린샷 2022-06-04 오후 4 13 43" src="https://user-images.githubusercontent.com/100512708/171988990-11e75a26-bdb2-4410-a3e7-9d813a883e6e.png">
  
</div>
</details>

<details>
<summary>8. 글 작성자의 공구후기 확인 기능</summary>
  
- 작성자의 마이페이지에서 공구 후기 확인 가능 
  
<div markdown="1">       
  
<img width="684" alt="스크린샷 2022-06-04 오후 4 20 34" src="https://user-images.githubusercontent.com/100512708/171989131-d9116c17-6a10-4853-a585-70c147c13836.png">
  
</div>
</details>


## API 설계


![API](https://user-images.githubusercontent.com/99785621/171988880-9d88db79-4b4a-43df-bb3d-76a55a75d7ae.png)

[API 설계 자세히보기] (https://www.notion.so/0d44c115d06240b98ba8ca171e9fed2c?v=329099a73f3d4e7595b8a6369a932387)





