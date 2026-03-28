"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Mail, User, BookOpen, Calendar } from "lucide-react";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  program_name?: string;
  year_of_study?: number;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userData = await apiFetch("/users/me");
        setUser(userData as UserProfile);
        setFormData(userData);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      setUser(updatedUser as UserProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">User Profile</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your account information and learning preferences</p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-8 text-center shadow-sm">
            <p className="text-slate-600">Loading profile...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
              <div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 shadow-sm hover:shadow-md"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <User size={16} className="text-indigo-600" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name || ""}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">{user.full_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Mail size={16} className="text-indigo-600" />
                      Email
                    </label>
                    <p className="text-slate-700 font-medium">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">Cannot be changed</p>
                  </div>

                  {/* Program Name */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <BookOpen size={16} className="text-indigo-600" />
                      Program
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="program_name"
                        value={formData.program_name || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., Computer Science"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">{user.program_name || "Not specified"}</p>
                    )}
                  </div>

                  {/* Year of Study */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Calendar size={16} className="text-indigo-600" />
                      Year of Study
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="year_of_study"
                        value={formData.year_of_study || ""}
                        onChange={handleInputChange}
                        min="1"
                        max="8"
                        placeholder="1-8"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">{user.year_of_study ? `Year ${user.year_of_study}` : "Not specified"}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-900">Bio</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio || ""}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    ) : (
                      <p className="text-slate-700">{user.bio || "No bio added yet"}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex gap-3 border-t border-slate-200/50 pt-6">
                    <button
                      onClick={handleSaveProfile}
                      className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 shadow-sm hover:shadow-md"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Member Since</p>
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Account Status</p>
                <p className="mt-4 text-lg font-semibold text-emerald-600">Active</p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Profile Completion</p>
                <p className="mt-4 text-lg font-semibold text-slate-900">75%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-8 text-center shadow-sm">
            <p className="text-slate-600">Failed to load profile. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
