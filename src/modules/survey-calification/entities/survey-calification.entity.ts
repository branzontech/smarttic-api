import { SurveyResponse } from 'src/modules/survey-response/entities/survey-response.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, DeleteDateColumn } from 'typeorm';

@Entity('SurveyCalifications')
export class SurveyCalification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  imageName: string;

  @Column({ type: 'text', nullable: true })
  imageBase64: string;

  @Column({ default: true })
  state: boolean;

  @OneToMany(() => SurveyResponse, (surveyResponse) => surveyResponse.surveyCalification)
  surveyResponses: SurveyResponse[];

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}

