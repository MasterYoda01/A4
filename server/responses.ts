import { User } from "./app";
import { CommentDoc } from "./concepts/comment";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friend";
import { MemoryDoc } from "./concepts/memory";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { ReflectionDoc } from "./concepts/reflection";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link ReflectionDoc} into a more readable format for the frontend.
 */
export default class Responses {

  /**
   * Convert ReflectionDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async reflection(reflection: ReflectionDoc | null) {
    if (!reflection) {
      return reflection;
    }
    const author = await User.getUserById(reflection.author);
    return { ...reflection, author: author.username };
  }

  /**
   * Same as {@link reflection} but for an array of ReflectionDoc for improved performance.
   */
  static async reflections(reflections: ReflectionDoc[]) {
    const authors = await User.idsToUsernames(reflections.map((reflection) => reflection.author));
    return reflections.map((reflection, i) => ({ ...reflection, author: authors[i] }));
  }

  /**
   * Convert MemoryDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async memory(memory: MemoryDoc | null) {
    if (!memory) {
      return memory;
    }
    const author = await User.getUserById(memory.author);
    return { ...memory, author: author.username };
  }

  /**
   * Same as {@link memory} but for an array of MemoryDoc for improved performance.
   */
  static async memories(memories: MemoryDoc[]) {
    const authors = await User.idsToUsernames(memories.map((memory) => memory.author));
    return memories.map((memory, i) => ({ ...memory, author: authors[i] }));
  }

  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert CommentDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await User.getUserById(comment.author);
    return { ...comment, author: author.username };
  }

  /**
   * Same as {@link comment} but for an array of CommentDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const authors = await User.idsToUsernames(comments.map((post) => post.author));
    return comments.map((comment, i) => ({ ...comment, author: authors[i] }));
  }

  
  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
