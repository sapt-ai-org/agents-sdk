import { apiFetch, buildQueryString } from './transport/http'
import type {
  AddMemberInput,
  AddMemberResult,
  InviteInput,
  InviteResult,
  TeamMember,
  UpdateRolesResult,
} from './types'

/** Team management operations scoped to the current project. */
export interface TeamNamespace {
  /** List all members of the project. */
  listMembers(): Promise<TeamMember[]>
  /** Invite a user by email. */
  invite(input: InviteInput): Promise<InviteResult>
  /** Add an existing user to the project. */
  addMember(input: AddMemberInput): Promise<AddMemberResult>
  /** Update a member's roles. */
  updateMemberRoles(userId: string, roleIds: string[]): Promise<UpdateRolesResult>
  /** Remove a member from the project. */
  removeMember(userId: string): Promise<void>
}

export function createTeamNamespace(
  endpoint: string,
  apiKey: string,
  projectId: string
): TeamNamespace {
  return {
    async listMembers() {
      const qs = buildQueryString({ projectId })
      const res = await apiFetch<{ members: TeamMember[] }>(endpoint, apiKey, `/team/members${qs}`)
      return res.members
    },

    async invite(input) {
      const res = await apiFetch<InviteResult>(endpoint, apiKey, '/team/invite', {
        method: 'POST',
        body: JSON.stringify({ projectId, ...input }),
      })
      return res
    },

    async addMember(input) {
      const res = await apiFetch<AddMemberResult>(endpoint, apiKey, '/team/members', {
        method: 'POST',
        body: JSON.stringify({ projectId, ...input }),
      })
      return res
    },

    async updateMemberRoles(userId, roleIds) {
      const qs = buildQueryString({ projectId })
      const res = await apiFetch<UpdateRolesResult>(
        endpoint,
        apiKey,
        `/team/members/${userId}${qs}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ roleIds }),
        }
      )
      return res
    },

    async removeMember(userId) {
      const qs = buildQueryString({ projectId })
      await apiFetch<unknown>(endpoint, apiKey, `/team/members/${userId}${qs}`, {
        method: 'DELETE',
      })
    },
  }
}
