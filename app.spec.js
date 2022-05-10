// const app = require("./app");

const supertest = require("supertest");
const express = require("express")

// const app = express()
// app.get("/user", (req, res) => res.json ({name : "moon"}))

// request(app)
//   .get("/user")
//   .expect(200, {name : "moon"})



describe('연결 테스트', () => {
    test("테스트 설명이 들어갑니다. 숫자1은 1의 결과를 줍니다.", () => {
      expect(1).toBe(1);
    });
 

    
    // test('/user/11 경로에 요청했을 때 status code가 200이어야 한다.', async () => {
    //   const res = await supertest(app).get("/index.html");
    //   expect(res.status).toEqual(200);
    // });
  
});

