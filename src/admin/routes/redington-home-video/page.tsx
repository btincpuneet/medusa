import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useState } from "react"

type HomeVideo = {
  id: number
  title: string
  url: string
  status: boolean
  created_at: string
  updated_at: string
}

type HomeVideoResponse = {
  home_videos?: HomeVideo[]
  home_video?: HomeVideo
  message?: string
}

const emptyForm = {
  title: "",
  url: "",
  status: "active",
}

const statusToBoolean = (value: string) => value === "active"

const HomeVideoPage: React.FC = () => {
  const [videos, setVideos] = useState<HomeVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchJson = useCallback(async (
    url: string,
    init?: RequestInit
  ): Promise<HomeVideoResponse> => {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    })

    if (!response.ok) {
      let body: any = null
      try {
        body = await response.json()
      } catch {
        // ignore body parse issues
      }
      const message =
        body?.message ||
        `Request failed with status ${response.status.toString()}`
      throw new Error(message)
    }

    try {
      return (await response.json()) as HomeVideoResponse
    } catch {
      return {}
    }
  }, [])

  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchJson("/admin/redington/home-videos")
      setVideos(data.home_videos ?? [])
    } catch (err: any) {
      setError(err.message || "Failed to load home videos.")
      setVideos([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedTitle = form.title.trim()
    const trimmedUrl = form.url.trim()

    if (!trimmedTitle || !trimmedUrl) {
      setMessage("Please provide both title and video URL.")
      return
    }

    setSaving(true)
    setMessage(null)

    const payload = {
      title: trimmedTitle,
      url: trimmedUrl,
      status: statusToBoolean(form.status),
    }

    const endpoint = editingId
      ? `/admin/redington/home-videos/${editingId}`
      : "/admin/redington/home-videos"

    const method = editingId ? "PUT" : "POST"

    try {
      await fetchJson(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      resetForm()
      await loadVideos()
      setMessage(
        editingId ? "Home video updated successfully." : "Home video added."
      )
    } catch (err: any) {
      setMessage(err.message || "Unable to save the home video.")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (video: HomeVideo) => {
    setEditingId(video.id)
    setForm({
      title: video.title,
      url: video.url,
      status: video.status ? "active" : "inactive",
    })
    setMessage(null)
  }

  const handleDelete = async (video: HomeVideo) => {
    if (!window.confirm(`Delete "${video.title}"?`)) {
      return
    }
    setDeletingId(video.id)
    setMessage(null)
    try {
      await fetchJson(`/admin/redington/home-videos/${video.id}`, {
        method: "DELETE",
      })
      if (editingId === video.id) {
        resetForm()
      }
      await loadVideos()
      setMessage("Home video removed.")
    } catch (err: any) {
      setMessage(err.message || "Failed to delete the video.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Home Video</h1>
        <p style={{ color: "#5f6c7b", marginTop: 8 }}>
          Manage the videos shown on the storefront Home page carousel.
          Records map directly to Magento{"'"}s <code>redington_home_video</code>{" "}
          payload so the React storefront keeps working without changes.
        </p>
      </div>

      <section
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
          marginBottom: 32,
        }}
      >
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginTop: 0 }}>
            {editingId ? "Edit Home Video" : "Add Home Video"}
          </h2>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: "1 1 280px" }}>
              <label
                htmlFor="title"
                style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
              >
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Premier Partner Showcase"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div style={{ flex: "1 1 280px" }}>
              <label
                htmlFor="url"
                style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
              >
                Video URL
              </label>
              <input
                id="url"
                name="url"
                type="text"
                value={form.url}
                onChange={handleChange}
                placeholder="https://media.redington.com/videos/launch.mp4"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div style={{ width: 180 }}>
              <label
                htmlFor="status"
                style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "#111827",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 6,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Add Video"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "9px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
            {message && (
              <span style={{ color: "#374151", fontSize: 14 }}>{message}</span>
            )}
          </div>
        </form>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 0,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div style={{ padding: "16px 20px" }}>
          <h2 style={{ margin: 0 }}>Video Library</h2>
          <p style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>
            Magento storefront requests this list via
            /rest/V1/redington-homevideo/homevideo/search.
          </p>
        </div>
        {error && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #fca5a5",
              color: "#b91c1c",
              background: "#fef2f2",
            }}
          >
            {error}
          </div>
        )}
        {isLoading ? (
          <div style={{ padding: 20 }}>Loading videos...</div>
        ) : videos.length === 0 ? (
          <div style={{ padding: 20, color: "#6b7280" }}>
            No videos found. Add one above to populate the list.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={{ padding: "12px 20px" }}>Title</th>
                  <th style={{ padding: "12px 20px" }}>URL</th>
                  <th style={{ padding: "12px 20px" }}>Status</th>
                  <th style={{ padding: "12px 20px" }}>Updated</th>
                  <th style={{ padding: "12px 20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr
                    key={video.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: "12px 20px", fontWeight: 500 }}>
                      {video.title}
                    </td>
                    <td
                      style={{
                        padding: "12px 20px",
                        fontFamily: "monospace",
                        fontSize: 13,
                      }}
                    >
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#2563eb" }}
                      >
                        {video.url}
                      </a>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: video.status
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: video.status ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {video.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", color: "#4b5563" }}>
                      {formatDate(video.updated_at)}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => startEdit(video)}
                          style={{
                            border: "1px solid #d1d5db",
                            background: "transparent",
                            padding: "6px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(video)}
                          disabled={deletingId === video.id}
                          style={{
                            border: "1px solid #fecaca",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            padding: "6px 12px",
                            borderRadius: 6,
                            cursor:
                              deletingId === video.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {deletingId === video.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({})

export default HomeVideoPage
