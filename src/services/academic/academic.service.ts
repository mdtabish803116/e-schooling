import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Subject } from '../../models/entities/academic/subject.entity';
import { ClassSectionSubject } from '../../models/entities/academic/class-section-subject.entity';

@Injectable()
export class AcademicService {
  private classRepo: Repository<Class>;
  private sectionRepo: Repository<Section>;
  private subjectRepo: Repository<Subject>;
  private mappingRepo: Repository<ClassSectionSubject>;

  constructor(private dataSource: DataSource) {
    this.classRepo = this.dataSource.getRepository(Class);
    this.sectionRepo = this.dataSource.getRepository(Section);
    this.subjectRepo = this.dataSource.getRepository(Subject);
    this.mappingRepo = this.dataSource.getRepository(ClassSectionSubject);
  }

  // CLASSES
  async createClass(schoolId: string, data: Partial<Class>, userId: string) {
    const newClass = this.classRepo.create({
      ...data,
      schoolId,
      createdById: userId,
      updatedById: userId,
    });
    return await this.classRepo.save(newClass);
  }

  async getClasses(schoolId: string) {
    return await this.classRepo.find({ where: { schoolId, isDeleted: false } });
  }

  async updateClass(schoolId: string, id: string, data: Partial<Class>, userId: string) {
    const existing = await this.classRepo.findOne({ where: { id, schoolId, isDeleted: false } });
    if (!existing) throw new NotFoundException('Class not found');
    Object.assign(existing, { ...data, updatedById: userId });
    return await this.classRepo.save(existing);
  }

  async deleteClass(schoolId: string, id: string, userId: string) {
    const existing = await this.classRepo.findOne({ where: { id, schoolId, isDeleted: false } });
    if (!existing) throw new NotFoundException('Class not found');
    existing.isDeleted = true;
    existing.updatedById = userId;
    return await this.classRepo.save(existing);
  }

  // SECTIONS
  async createSection(schoolId: string, data: Partial<Section>, userId: string) {
    const section = this.sectionRepo.create({
      ...data,
      schoolId,
      createdById: userId,
      updatedById: userId,
    });
    return await this.sectionRepo.save(section);
  }

  async getSections(schoolId: string, classId?: string) {
    const where: any = { schoolId, isDeleted: false };
    if (classId) where.classId = classId;
    return await this.sectionRepo.find({ where });
  }

  // SUBJECTS
  async createSubject(schoolId: string, data: Partial<Subject>, userId: string) {
    const subject = this.subjectRepo.create({
      ...data,
      schoolId,
      createdById: userId,
      updatedById: userId,
    });
    return await this.subjectRepo.save(subject);
  }

  async getSubjects(schoolId: string) {
    return await this.subjectRepo.find({ where: { schoolId, isDeleted: false } });
  }

  // MAPPINGS
  async assignSubjectToClassSection(schoolId: string, data: Partial<ClassSectionSubject>, userId: string) {
    const mapping = this.mappingRepo.create({
      ...data,
      schoolId,
      createdById: userId,
      updatedById: userId,
    });
    return await this.mappingRepo.save(mapping);
  }

  async getMappings(schoolId: string, classId?: string, sectionId?: string) {
    const where: any = { schoolId };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    return await this.mappingRepo.find({ where, relations: ['class', 'section', 'subject'] });
  }
}
