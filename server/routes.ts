import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Comment, Friend, Memory, Post, Reflection, User, WebSession } from "./app";
import { CommentDoc } from "./concepts/comment";
import { MemoryDoc } from "./concepts/memory";
import { PostDoc } from "./concepts/post";
import { ReflectionDoc } from "./concepts/reflection";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, prompt: string, inURL: string) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, prompt, inURL);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // new 
  @Router.get("/comments")
  async getPostComments(postId: ObjectId) { //here im going to get all the comments from a post
    let comments;
    comments = await Comment.getByPostId(postId);
    return Responses.comments(comments);
  }

  @Router.post("/comments/:postId")
  async createComment(session: WebSessionDoc, content: string, postId: ObjectId) { //done!
    const user = WebSession.getUser(session);
    const created = await Comment.create(user, content, postId);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments/:commentId")
  async updateComment(session: WebSessionDoc, commentId: ObjectId, update: Partial<CommentDoc>) {
    const user = WebSession.getUser(session);
    await Comment.isAuthor(user, commentId);
    return await Comment.update(commentId, update);
  }

  @Router.delete("/comments/:commentId")
  async deleteComment(session: WebSessionDoc, commentId: ObjectId) {
    const user = WebSession.getUser(session);
    await Comment.isAuthor(user, commentId);
    return Comment.delete(commentId);
  }
  
  @Router.get("/memories")
  async getAllReadyMemories(session: WebSessionDoc, author: ObjectId){
    const user = WebSession.getUser(session);
    // await Memory.isAuthor(user, author);
    const memories = await Memory.unlockAllReadyMemories(user);
    return memories
  }

  @Router.get("/memories/:dateRequested")
  async getRandomMemory(session: WebSessionDoc, author: ObjectId, dateRequested: Date ) {
    const user = WebSession.getUser(session);
    // await Memory.isAuthor(user, author);
    const memories = await Memory.unlockRandomMemory(user, dateRequested);
    return memories
  }
  
  @Router.post("/memories")
  async createMemory(session: WebSessionDoc, dateToOpen:string, content:string, imageurl?: string){
    const user = WebSession.getUser(session);
    const created = await Memory.create(user, new Date(dateToOpen), content);
    return { msg: created.msg, comment: await Responses.memory(created.memory) };
  }

  @Router.patch("/memories/:memoryId")
  async updateMemory(session: WebSessionDoc, memoryId: ObjectId, update: Partial<MemoryDoc>){
    const user = WebSession.getUser(session);
    await Memory.isAuthor(user, memoryId);
    return await Memory.update(memoryId, update);
  }

  @Router.delete("/memories/:memoryId")
  async deleteMemory(session: WebSessionDoc, memoryId: ObjectId) {
    const user = WebSession.getUser(session);
    await Memory.isAuthor(user, memoryId);
    return Comment.delete(memoryId);
  }

  @Router.get("/reflections")
  async getReflections(session: WebSessionDoc, author?: string) {
    let reflections;
    const user = WebSession.getUser(session);
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      reflections = await Reflection.getByAuthor(id);
    } else {
      reflections = await Reflection.getReflections({});
    }
    return Responses.reflections(reflections);
  }

  @Router.post("/reflections")
  async createReflection(session: WebSessionDoc, prompt: string, inURL: string) {
    const user = WebSession.getUser(session);
    const created = await Reflection.create(user, prompt, inURL);
    return { msg: created.msg, post: await Responses.reflection(created.reflection) };
  }

  @Router.patch("/reflections/:_id")
  async updateReflections(session: WebSessionDoc, _id: ObjectId, update: Partial<ReflectionDoc>) {
    const user = WebSession.getUser(session);
    await Reflection.isAuthor(user, _id);
    return await Reflection.update(_id, update);
  }

  @Router.delete("/reflections/:_id")
  async deleteReflection(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Reflection.isAuthor(user, _id);
    return Reflection.delete(_id);
  }

}

export default getExpressRouter(new Routes());
