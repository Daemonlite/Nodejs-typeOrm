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
  const posts = await this.postRepository.find({
    relations: ['author','comments','comments.author'],
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        id: true,
        firstName: true,
        lastName: true
      },
      comments: {
        content: true,
        createdAt: true,
        author: {
          firstName: true,
          lastName: true
        }
      }
    },
    order: { createdAt: 'DESC' },
    // take: 20 // example pagination
  });

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

  const post = await this.postRepository.find({
    where: { id },
    relations: ['author', 'comments', 'comments.author'],
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        id: true,
        firstName: true,
        lastName: true
      },
      comments:{
        content: true,
        createdAt: true,
        author: {
          firstName: true,
          lastName: true
        }
      }
    },
    order: { createdAt: 'DESC' },
  })


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
  try {
    const id = parseInt(request.params.id);
    
    if (isNaN(id)) {
      return response.status(400).json(createResponse(false, "Invalid user ID"));
    }

    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    const posts = await this.postRepository.find({
      where: { author: { id } },
      relations: ['author', 'comments', 'comments.author'],
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          firstName: true,
          lastName: true
        },
        comments: {
          content: true,
          createdAt: true,
          author: {
            firstName: true,
            lastName: true
          }
        }
      },
      order: { createdAt: 'DESC' },
    });

    return response.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: posts
    });
  } catch (error) {
    next(error); // pass to error handler middleware
  }
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
