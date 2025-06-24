import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn, 
  UpdateDateColumn
} from "typeorm";
import { User } from "./User";

@Entity()
export class Post {  

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    content: string;

    // Relationship - Many Posts belong to One User
    @ManyToOne(() => User, (user) => user.posts)
    author: User; 

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @UpdateDateColumn( { type: "timestamp", default: () => "CURRENT_TIMESTAMP"} )
    updatedAt: Date;

     
}