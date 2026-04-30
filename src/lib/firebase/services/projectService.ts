import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import {
  Project,
  ProjectSubTask,
  ProjectComment,
  ProjectAttachment,
  ProjectStatus,
} from '../types';
import { authService } from './authService';

class ProjectService {
  private collectionName = 'projects';
  private subTasksCollectionName = 'projectSubTasks';
  private commentsCollectionName = 'projectComments';

  // ── PROJECTS ────────────────────────────────────

  async getAllProjects(status?: ProjectStatus): Promise<Project[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);

      const projects: Project[] = [];
      for (const doc of snap.docs) {
        const project = await this.enrichProject(doc.id, { id: doc.id, ...doc.data() } as Project);
        projects.push(project);
      }

      return projects;
    } catch (error) {
      console.error('Get all projects error:', error);
      return [];
    }
  }

  async getProjectById(id: string): Promise<Project | null> {
    try {
      const projectSnap = await getDoc(doc(db, this.collectionName, id));
      if (!projectSnap.exists()) return null;

      const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
      return this.enrichProject(id, project);
    } catch (error) {
      console.error('Get project by ID error:', error);
      return null;
    }
  }

  private async enrichProject(projectId: string, project: Project): Promise<Project> {
    try {
      const [subTasks, comments] = await Promise.all([
        this.getSubTasksByProject(projectId),
        this.getCommentsByProject(projectId),
      ]);

      return {
        ...project,
        subTasks,
        comments: comments as any, // Store for reference, though not in Project interface
      };
    } catch {
      return project;
    }
  }

  async createProject(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>
  ): Promise<Project> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create projects');
    }

    try {
      const now = serverTimestamp();
      const newProject = {
        ...data,
        createdBy: user.uid,
        lastUpdatedBy: user.uid,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.collectionName), newProject);
      const project = await this.getProjectById(docRef.id);

      if (!project) {
        throw new Error('Failed to retrieve created project');
      }

      return project;
    } catch (error: any) {
      console.error('Create project error:', error);
      throw new Error(error.message || 'Failed to create project');
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update projects');
    }

    try {
      const updateData = {
        ...updates,
        lastUpdatedBy: user.uid,
        updatedAt: serverTimestamp(),
      };

      delete (updateData as any).id;
      delete (updateData as any).createdAt;
      delete (updateData as any).createdBy;
      delete (updateData as any).subTasks;
      delete (updateData as any).comments;

      await updateDoc(doc(db, this.collectionName, id), updateData);
    } catch (error: any) {
      console.error('Update project error:', error);
      throw new Error(error.message || 'Failed to update project');
    }
  }

  async deleteProject(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete projects');
    }

    try {
      // Delete all related sub-tasks and comments
      await this.deleteAllSubTasks(id);
      await this.deleteAllComments(id);
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete project error:', error);
      throw new Error(error.message || 'Failed to delete project');
    }
  }

  // ── SUB-TASKS ───────────────────────────────────

  async getSubTasksByProject(projectId: string): Promise<ProjectSubTask[]> {
    try {
      const q = query(
        collection(db, this.subTasksCollectionName),
        where('projectId', '==', projectId),
        orderBy('order', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectSubTask));
    } catch (error) {
      console.error('Get sub-tasks error:', error);
      return [];
    }
  }

  async createSubTask(
    projectId: string,
    data: Omit<ProjectSubTask, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectSubTask> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create sub-tasks');
    }

    try {
      const now = serverTimestamp();
      const newSubTask = {
        ...data,
        projectId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.subTasksCollectionName), newSubTask);
      const subTask = await getDoc(doc(db, this.subTasksCollectionName, docRef.id));

      if (!subTask.exists()) {
        throw new Error('Failed to retrieve created sub-task');
      }

      return { id: subTask.id, ...subTask.data() } as ProjectSubTask;
    } catch (error: any) {
      console.error('Create sub-task error:', error);
      throw new Error(error.message || 'Failed to create sub-task');
    }
  }

  async updateSubTask(id: string, updates: Partial<ProjectSubTask>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      delete (updateData as any).id;
      delete (updateData as any).projectId;
      delete (updateData as any).createdAt;

      await updateDoc(doc(db, this.subTasksCollectionName, id), updateData);
    } catch (error: any) {
      console.error('Update sub-task error:', error);
      throw new Error(error.message || 'Failed to update sub-task');
    }
  }

  async deleteSubTask(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      await deleteDoc(doc(db, this.subTasksCollectionName, id));
    } catch (error: any) {
      console.error('Delete sub-task error:', error);
      throw new Error(error.message || 'Failed to delete sub-task');
    }
  }

  async reorderSubTasks(projectId: string, subTaskIds: string[]): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      const updatePromises = subTaskIds.map((id, index) =>
        updateDoc(doc(db, this.subTasksCollectionName, id), {
          order: index,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('Reorder sub-tasks error:', error);
      throw new Error(error.message || 'Failed to reorder sub-tasks');
    }
  }

  private async deleteAllSubTasks(projectId: string): Promise<void> {
    const subTasks = await this.getSubTasksByProject(projectId);
    const deletePromises = subTasks.map(task => deleteDoc(doc(db, this.subTasksCollectionName, task.id)));
    await Promise.all(deletePromises);
  }

  // ── COMMENTS ────────────────────────────────────

  async getCommentsByProject(projectId: string): Promise<ProjectComment[]> {
    try {
      const q = query(
        collection(db, this.commentsCollectionName),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectComment));
    } catch (error) {
      console.error('Get comments error:', error);
      return [];
    }
  }

  async createComment(projectId: string, content: string): Promise<ProjectComment> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Must be logged in to comment');
    }

    try {
      const now = serverTimestamp();
      const newComment = {
        projectId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Unknown',
        userRole: user.role,
        content,
        reactions: [],
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.commentsCollectionName), newComment);
      const comment = await getDoc(doc(db, this.commentsCollectionName, docRef.id));

      if (!comment.exists()) {
        throw new Error('Failed to retrieve created comment');
      }

      return { id: comment.id, ...comment.data() } as ProjectComment;
    } catch (error: any) {
      console.error('Create comment error:', error);
      throw new Error(error.message || 'Failed to create comment');
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    try {
      await deleteDoc(doc(db, this.commentsCollectionName, commentId));
    } catch (error: any) {
      console.error('Delete comment error:', error);
      throw new Error(error.message || 'Failed to delete comment');
    }
  }

  async addReaction(commentId: string, emoji: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    try {
      const commentSnap = await getDoc(doc(db, this.commentsCollectionName, commentId));
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as ProjectComment;
      const reactions = comment.reactions || [];

      // Check if user already reacted with this emoji
      const existingIndex = reactions.findIndex(r => r.userId === user.uid && r.emoji === emoji);
      if (existingIndex === -1) {
        reactions.push({
          userId: user.uid,
          emoji,
          timestamp: Timestamp.now(),
        });

        await updateDoc(doc(db, this.commentsCollectionName, commentId), {
          reactions,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      console.error('Add reaction error:', error);
      throw new Error(error.message || 'Failed to add reaction');
    }
  }

  async removeReaction(commentId: string, emoji: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    try {
      const commentSnap = await getDoc(doc(db, this.commentsCollectionName, commentId));
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as ProjectComment;
      const reactions = (comment.reactions || []).filter(
        r => !(r.userId === user.uid && r.emoji === emoji)
      );

      await updateDoc(doc(db, this.commentsCollectionName, commentId), {
        reactions,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Remove reaction error:', error);
      throw new Error(error.message || 'Failed to remove reaction');
    }
  }

  private async deleteAllComments(projectId: string): Promise<void> {
    const comments = await this.getCommentsByProject(projectId);
    const deletePromises = comments.map(comment => deleteDoc(doc(db, this.commentsCollectionName, comment.id)));
    await Promise.all(deletePromises);
  }

  // ── FILE ATTACHMENTS ────────────────────────────

  async addAttachment(projectId: string, attachment: ProjectAttachment): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can add attachments');
    }

    try {
      const projectSnap = await getDoc(doc(db, this.collectionName, projectId));
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const project = projectSnap.data() as Project;
      const attachments = project.attachments || [];
      attachments.push(attachment);

      await updateDoc(doc(db, this.collectionName, projectId), {
        attachments,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Add attachment error:', error);
      throw new Error(error.message || 'Failed to add attachment');
    }
  }

  async deleteAttachment(projectId: string, attachmentId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete attachments');
    }

    try {
      const projectSnap = await getDoc(doc(db, this.collectionName, projectId));
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const project = projectSnap.data() as Project;
      const attachments = (project.attachments || []).filter(a => a.id !== attachmentId);

      await updateDoc(doc(db, this.collectionName, projectId), {
        attachments,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Delete attachment error:', error);
      throw new Error(error.message || 'Failed to delete attachment');
    }
  }

  // ── AGENDA INTEGRATION ──────────────────────────

  async linkAgendaTask(projectId: string, taskId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      const projectSnap = await getDoc(doc(db, this.collectionName, projectId));
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const project = projectSnap.data() as Project;
      const taskIds = project.agendaTaskIds || [];

      if (!taskIds.includes(taskId)) {
        taskIds.push(taskId);

        await updateDoc(doc(db, this.collectionName, projectId), {
          agendaTaskIds: taskIds,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      console.error('Link agenda task error:', error);
      throw new Error(error.message || 'Failed to link agenda task');
    }
  }

  async unlinkAgendaTask(projectId: string, taskId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      const projectSnap = await getDoc(doc(db, this.collectionName, projectId));
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const project = projectSnap.data() as Project;
      const taskIds = (project.agendaTaskIds || []).filter(id => id !== taskId);

      await updateDoc(doc(db, this.collectionName, projectId), {
        agendaTaskIds: taskIds,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Unlink agenda task error:', error);
      throw new Error(error.message || 'Failed to unlink agenda task');
    }
  }

  subscribeToProjects(
    callback: (projects: Project[]) => void,
    status?: ProjectStatus
  ): Unsubscribe {
    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      const q = query(collection(db, this.collectionName), ...constraints);

      return onSnapshot(
        q,
        async (querySnapshot) => {
          const projects: Project[] = [];
          for (const doc of querySnapshot.docs) {
            const project = await this.enrichProject(doc.id, {
              id: doc.id,
              ...doc.data(),
            } as Project);
            projects.push(project);
          }
          callback(projects);
        },
        (error) => {
          console.error('Subscribe to projects error:', error);
        }
      );
    } catch (error) {
      console.error('Subscribe to projects error:', error);
      return () => {};
    }
  }
}

export const projectService = new ProjectService();
