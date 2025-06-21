import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class Otp {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    phoneNumber: string

    @Column({ nullable: true })
    email: string

    @Column()
    code: string

    @Column()
    expiresAt: Date

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}