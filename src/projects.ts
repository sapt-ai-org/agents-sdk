import { apiFetch } from './transport/http'
import type { Project } from './types'

/** Operations for listing and retrieving projects. */
export interface ProjectsNamespace {
  /** List all projects accessible to the authenticated identity. */
  list(): Promise<Project[]>
  /** Get a single project by ID. */
  get(projectId: string): Promise<Project>
}

export function createProjectsNamespace(
  endpoint: string,
  apiKey: string
): ProjectsNamespace {
  return {
    async list() {
      const res = await apiFetch<{ projects: Project[] }>(endpoint, apiKey, '/projects')
      return res.projects
    },

    async get(projectId) {
      const res = await apiFetch<{ project: Project }>(endpoint, apiKey, `/projects/${projectId}`)
      return res.project
    },
  }
}
