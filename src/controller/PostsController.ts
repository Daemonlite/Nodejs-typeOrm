import { AppDataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { Post } from "../entities/Posts";
import { User } from "../entities/User";
import { createResponse } from "../interfaces/otp.interface";

export class PostsController {
  private postRepository = AppDataSource.getRepository(Post);
  private userRepository = AppDataSource.getRepository(User);

  async fetchAllPosts(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const posts = await this.postRepository
  .createQueryBuilder("post")
  .leftJoinAndSelect("post.author", "author")
  .select([
    "post.id",
    "post.title",
    "post.content",
    "post.createdAt",
    "post.updatedAt",
    "author.id",
    "author.firstName",
    "author.lastName", 
  ])
  .orderBy("post.createdAt", "DESC")
  .getMany();

  return response
    .status(200)
    .json(createResponse(true, "Posts fetched successfully", posts));
}

  async retrievePostsById(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const id = parseInt(request.params.id);

  const post = await this.postRepository
  .createQueryBuilder("post")
  .leftJoinAndSelect("post.author", "author")
  .select([
    "post.id",
    "post.title",
    "post.content",
    "post.createdAt",
    "post.updatedAt",
    "author.id",
    "author.firstName",
    "author.lastName", 
  ])
  .orderBy("post.createdAt", "DESC")
  .where("post.id = :id", { id })
  .getMany();

  if (!post) {
    return response
      .status(404)
      .json(createResponse(false, "Post not found"));
  }

  return response
    .status(200)
    .json(createResponse(true, "Post fetched successfully", post));
}


  async fetchUserPost(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const id = parseInt(request.params.id);

  const user = await this.userRepository.findOneBy({ id });

  if (!user) {
    return response
      .status(404)
      .json(createResponse(false, "User not found"));
  }

  const posts = await this.postRepository.createQueryBuilder("post")
  .leftJoinAndSelect("post.author", "author")
  .select([
    "post.id",
    "post.title",
    "post.content",
    "post.createdAt",
    "post.updatedAt",
    "author.id",
    "author.firstName",
    "author.lastName",
  ])
  .where("author.id = :id", { id })
  .orderBy("post.createdAt", "DESC")
  .getMany();

  return response
    .status(200)
    .json(createResponse(true, "Posts fetched successfully", posts));
}

  async createPost(request: Request, response: Response, next: NextFunction) {
    const { title, content } = request.body;

    if (!title) {
      return response
        .status(400)
        .json(createResponse(false, "title is required"));
    } else if (!content) {
      return response
        .status(400)
        .json(createResponse(false, "content is required"));
    }


    const post = new Post();
    post.title = title;
    post.content = content;
    post.author = request.user;

    await this.postRepository.save(post);

    return response
      .status(201)
      .json(createResponse(true, "Post created successfully", post));
  }

  async updatePost(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);
    const data = request.body;

    const post = await this.postRepository.findOneBy({ id });

    if (!post) {
      return response.status(404).json(createResponse(false, "Post not found"));
    }

    await this.postRepository.update(id, data);

    return response
      .status(200)
      .json(createResponse(true, "Post updated successfully"));

    }

    async deletePost(request: Request, response: Response, next: NextFunction) {
      const id = parseInt(request.params.id);

      const post = await this.postRepository.findOneBy({ id });

      if (!post) {
        return response.status(404).json(createResponse(false, "Post not found"));
      }

      await this.postRepository.delete(id);

      return response
        .status(200)
        .json(createResponse(true, "Post deleted successfully"));
    }


}
