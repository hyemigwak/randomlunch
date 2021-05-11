import { createAction, handleActions } from "redux-actions";
import { produce } from "immer";
import axios from "axios";
import { setCookie, deleteCookie, getCookie } from "../../shared/Cookie";
import { config } from "../../shared/config";
import GoogleLogin from "react-google-login";

//actions
const LOG_IN = "LOG_IN"; //로그인
const LOG_OUT = "LOG_OUT"; //로그아웃
const LOGIN_CHECK = "LOGIN_CHECK"; //로그인 유지
const GET_USER = "GET_USER"; //유저email 있는지 여부 받아오기
const VALIDATE_EMAIL = "VALIDATE_EMAIL"; //이메일 인증 확인
const FIND_PWD = "FIND_PWD"; //비밀번호 찾기
const CHANGE_PWD = "CHANGE_PWD"; //비밀번호 변경

//actionCreators
const logIn = createAction(LOG_IN, (user, login_type) => ({ user,login_type}));
const logOut = createAction(LOG_OUT, (user) => ({ user }));
const loginCheck = createAction(LOGIN_CHECK, (cookie) => ({ cookie }));
const getUser = createAction(GET_USER, (user) => ({ user })); // 이메일 중복체크
const validateEmail = createAction(VALIDATE_EMAIL, (user) => ({ user })); //이메일 인증
const findPwd = createAction(FIND_PWD, (user_info) => ({ user_info }));
const changePwd = createAction(CHANGE_PWD, (user_info) => ({ user_info }));

//initialState
const initialState = {
  user: {},//딕셔너리형태
  is_login: false,
  is_exist: false, // 이메일 중복체크
  is_email_validate: false, //이메일 인증
  login_type: "normal", //일반로그인은 normal로 설정
};

//미들웨어

//구글 로그인
const GoogleLoginAPI = (response) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config.api}/account/googleAuth`,
      data: {
        // accessToken: response.accessToken,
        // type:response.profileObj.type,
        email: response.profileObj.email,
        firstName: response.profileObj.name,
        lastName: response.profileObj.familyName ? response.profileObj.familyName : "",
      },
      // headers: {
      //   "Content-Type": "application/json",
      // },
    })
      .then((res) => {
        console.log(res.data, "googleLogin"); // response 확인
        if (res.data.msg === "success") {
          console.log(res.data);
          
          //토큰 받아오기
          const jwtToken = res.data.token;
          const nickname = res.data.nickname;
          const email=res.data.email;

          //토큰 저장하기
          setCookie("user_token", jwtToken); //쿠키에 user_token 이라는 이름으로 저장
          setCookie("nickname", nickname);
          setCookie("email",email);

          //딕셔너리
          const user_data={
            email:res.data.email,
            nickname:res.data.nickname,
            token:res.data.token
          }


          //디폴트로 헤더에 토큰 담아주기
          // axios.defaults.headers.common["Authorization"] = `${jwtToken}`;
          dispatch(logIn(user_data,"google"));

          window.alert("정상적으로 로그인 되었습니다!");
          history.push("/");
        } else {
          console.log("구글로그인 msg === fail");
        }
      })
      .catch((err) => {
        console.log("구글로그인오류", err);
      });
  };
};

//카카오 로그인
const kakaoLoginAPI = (response) => {
  return function (dispatch, getState, { history }) {
    
    axios({
      method: "POST",
      url: `${config.api}/account/kakaoAuth`,
      data: {
        email: response.profile.kakao_account.email,
        nickname: response.profile.properties.nickname,
      },
      
    })
      .then((res) => {
        if (res.data.msg === "success") {
          console.log(res.data); // response 확인
          
          //토큰 받아오기
          const jwtToken = res.data.token;
          const nickname = res.data.nickname;

          //토큰 저장하기
          setCookie("user_token", jwtToken); //쿠키에 user_token 이라는 이름으로 저장
          setCookie("kakao_nickname", nickname);


             //딕셔너리
             const user_data={
              email:res.data.email,
              nickname:res.data.nickname,
              token:res.data.token
            }

        //로그인 액션 디스패치 해주기
        //로그인타입 넣어주기
        dispatch(logIn(user_data,"kakao"));
        

     
          //디폴트로 헤더에 토큰 담아주기
          // axios.defaults.headers.common["Authorization"] = `${jwtToken}`;
          // dispatch(logIn(res.data));

          window.alert("정상적으로 로그인 되었습니다!");
          history.push("/");

        } else {
          console.log("카카오 res.data.msg fail");
        }
      })
      .catch((err) => {
        console.log("kakaologin오류", err);
      });
  };
};

//일반 로그인
const loginAPI = (email, pwd) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config.api}/account/login`,
      data: {
        email: email,
        password: pwd,
      },
    })
      .then((res) => {
        if (res.data.msg === "success") {
          console.log(res.data); // response 확인

          const jwtToken = res.data.token;
          const nickname = res.data.nickname;
          const email = res.data.email;

          setCookie("user_login", jwtToken); //쿠키에 user_login 이라는 이름으로 저장
          localStorage.setItem("nickname", nickname); //유저 닉네임 저장
          localStorage.setItem("email", email); //유저 이메일 저장 -> 나만 보이는 버튼에서 true/false 여부로 쓸 예정

           //딕셔너리
          const user_data={
            email:res.data.email,
            nickname:res.data.nickname,
            token:res.data.token
          }
 
          //디폴트로 헤더에 토큰 담아주기
          //axios.defaults.headers.common["Authorization"] = `${jwtToken}`;

          dispatch(logIn(user_data,"normal"));

          window.alert("정상적으로 로그인 되었습니다!");
          history.push("/");
          //자동로그아웃 -> 로그인 하자마자 1시간(토큰 만료) 되면 알럿창과 함께 로그아웃 함수 실행
          setTimeout(function () {
            window.alert("1시간이 경과하여 자동 로그아웃 됩니다");
            dispatch(logOut());
            history.replace("/");
          }, 1000 * 60 * 60);

        } else {
          window.alert("로그인에 실패했습니다!");
        }
      })
      .catch((err) => {
        console.log("loginAPI에서 오류 발생", err);
      });
  };
};

//회원가입
const signupAPI = (email, nickname, pwd, address) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config.api}/account`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
      },
      data: {
        email: email,
        nickname: nickname,
        password: pwd,
        address: address,
      },
    })
      .then((res) => {
        console.log(res);
        window.alert("축하합니다. 동물마켓의 회원이 되어주셔서 감사합니다.");
        history.push("/login");
      })
      .catch((err) => {
        console.log("signupAPI에서 오류발생", err);
      });
  };
};

//이메일 중복확인
const EmailCheckAPI = (email) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config.api}/account/chkEmail`,
      data: {
        email: email,
      },
    })
      .then((res) => {
        console.log(res.data);
        if (res.data.msg === "success") {
          dispatch(getUser(true));
        } else {
          window.alert("중복된 ID입니다.");
        }
      })
      .catch((err) => {
        console.log("EmailCheckAPI에서 오류 발생", err);
      });
  };
};

//이메일 인증 메일 요청 api
const EmailValidationAPI = (email) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config}/`,
      data: {
        email: email,
      },
    })
      .then((res) => {
        console.log(res.data);
        if (res.data.msg === "success") {
          dispatch(validateEmail(true));
        }
      })
      .catch((err) => {
        console.log("EmailValidationAPI에서 오류 발생", err);
      });
  };
};

//비밀번호 찾기
const FindPwdAPI = (email) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config.api}/account/find`,
      data: {
        email: email,
      },
    })
      .then((res) => {
        console.log(res.data);
        //dispatch(findPwd())
        //서버에 이메일만 넘겨주면, 유효성 검사는 서버에서 함. response가 succeess인지만 check!
      })
      .catch((err) => {
        console.log("FindPwdAPI에서 오류 발생", err);
      });
  };
};

//비밀번호 변경
const ChangePwdAPI = (pwd, newPwd) => {
  return function (dispatch, getState, { history }) {
    axios({
      method: "POST",
      url: `${config.api}/account/find`,
      data: {
        pwd: pwd,
        newPwd: newPwd,
      },
    })
      .then((res) => {
        console.log(res.data);
        //dispatch(changePwd())
      })
      .catch((err) => {
        console.log("ChangePwdAPI에서 오류 발생", err);
      });
  };
};

//로그아웃 미들웨어
//구글로그인하면 구글로그아웃, 카카오로그인하면 카카오로그아웃 해주기 위해서 
// initialstate에서 정의해준 login_type를 가져옴
//api에서 내려주는 게 없으니까 =()=> 비워둠

const LogOutMiddleware=()=>{

  return function(dispatch, getState, { history }){
  
    const loginType = getState().user.login_type;
    console.log(loginType);

  if(loginType=="normal")
   {
    deleteCookie("user_login");
    deleteCookie("email");
    deleteCookie("nickname");
    localStorage.clear();
    dispatch(logOut());

    return;
   }

   if(loginType=="kakao")
   {
   
    deleteCookie("user_token"); 
    deleteCookie("kakao_nickname");
    localStorage.clear();
    dispatch(logOut());
 
    return;
   }
   if(loginType=="google")
   {
     //구글닉넴따로 해야댐
     //딜리트쿠키에
     deleteCookie("email");
     deleteCookie("nickname");
    deleteCookie("G_AUTHUSER_H");
    localStorage.clear();
    dispatch(logOut());
 
    return;
   }
  };

};

//reducer
export default handleActions(
  {
    
    [LOG_IN]: (state, action) =>
      produce(state, (draft) => {
        draft.user = action.payload.user;//유저가 딕셔너리
        draft.is_login = true;
        draft.login_type=action.payload.login_type;
      }),
    [LOG_OUT]: (state, action) =>
      produce(state, (draft) => {     
        // deleteCookie("user_login");
        // deleteCookie("nickname");
        // deleteCookie("email");
        // deleteCookie("G_AUTHUSER_H");
        // deleteCookie("user_token"); 
        // deleteCookie("kakao_nickname");
        // localStorage.clear();
        draft.user = null;
        draft.is_login = true;
      }),
    [LOGIN_CHECK]: (state, action) =>
      produce(state, (draft) => {
        draft.is_login = action.payload.cookie;
      }),
    [GET_USER]: (state, action) =>
      produce(state, (draft) => {
        draft.is_exist = action.payload.user;
        console.log(action.payload);
        console.log(action.payload.user);
      }),
    [VALIDATE_EMAIL]: (state, action) =>
      produce(state, (draft) => {
        draft.is_email_validate = action.payload.user;
      }),
  },
  initialState
);

//action creator export
const actionCreators = {
  loginAPI,
  loginCheck,
  signupAPI,
  logOut,
  kakaoLoginAPI,
  GoogleLoginAPI,
  EmailCheckAPI,
  EmailValidationAPI,
  FindPwdAPI,
  ChangePwdAPI,
  LogOutMiddleware,

};

export { actionCreators };
