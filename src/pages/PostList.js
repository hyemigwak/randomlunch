import React, { useEffect } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { actionCreators as postActions } from "../redux/modules/post";

import Post from "../components/Post";
const PostList = (props) => {
  const dispatch = useDispatch();
  const postList = useSelector((state) => state.post.post_list);

  //길이를 확인해서, 길이 변화가 있다면 재렌더링 => 새로 등록했을때 리렌더
  const postLength = postList?.length;

  useEffect(() => {
    dispatch(postActions.getPostAPI());
  }, [postLength]);

  return (
    <React.Fragment>
      <PostListC>
        {postList?.map((post, idx) => {
          return <Post {...post} key={idx} />;
        })}
      </PostListC>
    </React.Fragment>
  );
};

const PostListC = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-left: 118px;
`;

export default PostList;
