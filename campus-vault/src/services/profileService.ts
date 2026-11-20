import { apiRequest, ApiRequestError } from "@/services/apiClient";
import {
  userSessionSchema,
  type AcademicLevel,
  type UserProfile,
} from "@/types/profile";
import type { User } from "firebase/auth";

export const profileService = {
  async getCurrentProfile(user: User): Promise<UserProfile> {
    const session = await apiRequest("/auth/session", userSessionSchema);
    return session.profile;
  },

  async createProfile(user: User, fullName: string): Promise<UserProfile> {
    const session = await apiRequest("/auth/profile", userSessionSchema, {
      method: "POST",
      body: { fullName },
    });
    return session.profile;
  },

  async getOrCreateCurrentProfile(user: User): Promise<UserProfile> {
    try {
      return await this.getCurrentProfile(user);
    } catch (error) {
      if (
        !(error instanceof ApiRequestError) ||
        error.code !== "PROFILE_NOT_FOUND"
      ) {
        throw error;
      }

      const fullName = user.displayName?.trim();
      if (!fullName || fullName.length < 2) throw error;
      return this.createProfile(user, fullName);
    }
  },

  async updateAcademicProfile(
    user: User,
    input: { departmentId: "geology" | null; level: AcademicLevel },
  ): Promise<UserProfile> {
    if (!user.emailVerified) {
      throw new Error(
        "Verify your email before updating your Campus Vault profile.",
      );
    }

    const session = await apiRequest("/auth/profile", userSessionSchema, {
      method: "PATCH",
      body: input,
    });
    return session.profile;
  },
};
