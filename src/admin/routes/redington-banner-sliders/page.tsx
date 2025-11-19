import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type Banner = {
  id: number
  title: string
  image_url: string | null
  link_url: string | null
  sort_order: number
  status: boolean
}

type BannerSlider = {
  id: number
  identifier: string
  title: string
  status: boolean
  created_at?: string
  updated_at?: string
  banners: Banner[]
}

type ApiResponse = {
  sliders?: BannerSlider[]
  slider?: BannerSlider
  banners?: Banner[]
  banner?: Banner
  message?: string
}

const emptySliderForm = {
  title: "",
  identifier: "",
  status: true,
}

const emptyBannerForm = {
  id: 0,
  title: "",
  image_url: "",
  link_url: "",
  sort_order: 0,
  status: true,
}

const RedingtonBannerSlidersPage: React.FC = () => {
  const [sliders, setSliders] = useState<BannerSlider[]>([])
  const [selectedSlider, setSelectedSlider] = useState<BannerSlider | null>(null)
  const [sliderForm, setSliderForm] = useState(emptySliderForm)
  const [bannerForm, setBannerForm] = useState(emptyBannerForm)
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingSlider, setIsSavingSlider] = useState(false)
  const [isSavingBanner, setIsSavingBanner] = useState(false)

  const loadSliders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/admin/redington/banner-sliders", {
        credentials: "include",
      })
      const body = (await response.json().catch(() => ({}))) as ApiResponse
      if (!response.ok) {
        throw new Error(body?.message || "Failed to load banner sliders")
      }
      setSliders(body.sliders ?? [])
      if (body.sliders?.length) {
        if (!selectedSlider) {
          setSelectedSlider(body.sliders[0])
          setSliderForm({
            title: body.sliders[0].title,
            identifier: body.sliders[0].identifier,
            status: body.sliders[0].status,
          })
        } else {
          const refreshed = body.sliders.find((slider) => slider.id === selectedSlider.id)
          if (refreshed && refreshed.updated_at !== selectedSlider.updated_at) {
            setSelectedSlider(refreshed)
            setSliderForm({
              title: refreshed.title,
              identifier: refreshed.identifier,
              status: refreshed.status,
            })
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data")
      setSliders([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedSlider?.id, selectedSlider?.updated_at])

  useEffect(() => {
    void loadSliders()
  }, [loadSliders])

  const handleSliderSelect = (slider: BannerSlider | null) => {
    setSelectedSlider(slider)
    if (slider) {
      setSliderForm({
        title: slider.title,
        identifier: slider.identifier,
        status: slider.status,
      })
    } else {
      setSliderForm(emptySliderForm)
    }
    setBannerForm(emptyBannerForm)
    setEditingBannerId(null)
    setStatusMessage(null)
    setError(null)
  }

  const handleSliderInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    if (name === "status") {
      setSliderForm((prev) => ({ ...prev, status: value === "true" }))
    } else {
      setSliderForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSliderSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingSlider(true)
    setStatusMessage(null)
    setError(null)

    const method = selectedSlider?.id ? "PUT" : "POST"
    const url = selectedSlider?.id
      ? `/admin/redington/banner-sliders/${selectedSlider.id}`
      : "/admin/redington/banner-sliders"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: sliderForm.title,
          identifier: sliderForm.identifier,
          status: sliderForm.status,
        }),
      })
      const body = (await response.json().catch(() => ({}))) as ApiResponse
      if (!response.ok) {
        throw new Error(
          body?.message ||
            (selectedSlider ? "Unable to update slider." : "Unable to create slider.")
        )
      }
      setStatusMessage(selectedSlider ? "Slider updated." : "Slider created.")
      handleSliderSelect(body.slider ?? null)
      await loadSliders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save slider.")
    } finally {
      setIsSavingSlider(false)
    }
  }

  const handleSliderDelete = async (slider: BannerSlider) => {
    if (!window.confirm(`Delete slider "${slider.title}"? This cannot be undone.`)) {
      return
    }
    setError(null)
    setStatusMessage(null)
    try {
      const response = await fetch(`/admin/redington/banner-sliders/${slider.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiResponse
        throw new Error(body?.message || "Unable to delete slider.")
      }
      if (selectedSlider?.id === slider.id) {
        handleSliderSelect(null)
      }
      await loadSliders()
      setStatusMessage("Slider deleted.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete slider.")
    }
  }

  const handleBannerInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    if (name === "status") {
      setBannerForm((prev) => ({ ...prev, status: value === "true" }))
    } else if (name === "sort_order") {
      setBannerForm((prev) => ({ ...prev, sort_order: Number(value) || 0 }))
    } else {
      setBannerForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleBannerEdit = (banner: Banner) => {
    setEditingBannerId(banner.id)
    setBannerForm({
      id: banner.id,
      title: banner.title,
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      sort_order: banner.sort_order,
      status: banner.status,
    })
    setStatusMessage(null)
    setError(null)
  }

  const handleBannerSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedSlider) {
      setError("Select or create a slider before adding banners.")
      return
    }
    setIsSavingBanner(true)
    setStatusMessage(null)
    setError(null)

    const isEdit = Boolean(editingBannerId)
    const url = isEdit
      ? `/admin/redington/banner-sliders/${selectedSlider.id}/banners/${editingBannerId}`
      : `/admin/redington/banner-sliders/${selectedSlider.id}/banners`

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: bannerForm.title,
          image_url: bannerForm.image_url || null,
          link_url: bannerForm.link_url || null,
          sort_order: bannerForm.sort_order,
          status: bannerForm.status,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as ApiResponse
      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit ? "Unable to update banner." : "Unable to create banner.")
        )
      }

      setStatusMessage(isEdit ? "Banner updated." : "Banner created.")
      setEditingBannerId(null)
      setBannerForm(emptyBannerForm)
      await loadSliders()
      if (body.banner) {
        const refreshed = await fetch(
          `/admin/redington/banner-sliders/${selectedSlider.id}`,
          { credentials: "include" }
        )
        if (refreshed.ok) {
          const detail = (await refreshed.json()) as ApiResponse
          handleSliderSelect(detail.slider ?? null)
        }
      } else {
        handleSliderSelect(selectedSlider)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save banner.")
    } finally {
      setIsSavingBanner(false)
    }
  }

  const handleBannerDelete = async (banner: Banner) => {
    if (!selectedSlider) {
      return
    }
    if (!window.confirm(`Delete banner "${banner.title}"?`)) {
      return
    }

    try {
      const response = await fetch(
        `/admin/redington/banner-sliders/${selectedSlider.id}/banners/${banner.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiResponse
        throw new Error(body?.message || "Unable to delete banner.")
      }
      setStatusMessage("Banner deleted.")
      setEditingBannerId(null)
      setBannerForm(emptyBannerForm)
      await loadSliders()
      handleSliderSelect(selectedSlider)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete banner.")
    }
  }

  const selectedBanners = useMemo(() => selectedSlider?.banners ?? [], [selectedSlider])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Manage Banners</h1>
          <p style={{ margin: "8px 0 0", color: "#475569" }}>
            Review sliders imported from Magento and edit their banners.
          </p>
        </div>
        <button
          style={{
            background: "#f97316",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => handleSliderSelect(null)}
        >
          Add New Slider
        </button>
      </header>

      {error ? (
        <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div>
      ) : null}
      {statusMessage ? (
        <div style={{ color: "#15803d", fontSize: 14 }}>{statusMessage}</div>
      ) : null}

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
        <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>Sliders</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Title</th>
                <th style={{ padding: 12 }}>Identifier</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Banners</th>
                <th style={{ padding: 12, width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16 }}>
                    Loading...
                  </td>
                </tr>
              ) : sliders.length ? (
                sliders.map((slider) => (
                  <tr key={slider.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 12 }}>{slider.id}</td>
                    <td style={{ padding: 12 }}>{slider.title}</td>
                    <td style={{ padding: 12 }}>{slider.identifier}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: slider.status ? "#dcfce7" : "#fee2e2",
                          color: slider.status ? "#166534" : "#b91c1c",
                          fontSize: 12,
                        }}
                      >
                        {slider.status ? "Enable" : "Disable"}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{slider.banners?.length ?? 0}</td>
                    <td style={{ padding: 12 }}>
                      <button
                        style={{
                          marginRight: 8,
                          border: "1px solid #cbd5f5",
                          borderRadius: 4,
                          background: "#fff",
                          cursor: "pointer",
                          padding: "4px 10px",
                        }}
                        onClick={() => handleSliderSelect(slider)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          border: "1px solid #fecdd3",
                          borderRadius: 4,
                          background: "#fff",
                          color: "#b91c1c",
                          cursor: "pointer",
                          padding: "4px 10px",
                        }}
                        onClick={() => handleSliderDelete(slider)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "#94a3b8" }}>
                    No banner sliders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>
            {selectedSlider ? `Edit Slider #${selectedSlider.id}` : "Create Slider"}
          </h2>
          <form onSubmit={handleSliderSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Title *</span>
              <input
                name="title"
                value={sliderForm.title}
                onChange={handleSliderInputChange}
                required
                style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5f5" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Identifier</span>
              <input
                name="identifier"
                value={sliderForm.identifier}
                onChange={handleSliderInputChange}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5f5" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Status</span>
              <select
                name="status"
                value={sliderForm.status ? "true" : "false"}
                onChange={handleSliderInputChange}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5f5" }}
              >
                <option value="true">Enable</option>
                <option value="false">Disable</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={isSavingSlider}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#111827",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isSavingSlider ? "Saving..." : selectedSlider ? "Save Slider" : "Create Slider"}
            </button>
          </form>
        </div>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>
            {editingBannerId ? `Edit Banner #${editingBannerId}` : "Add Banner"}
          </h2>
          {selectedSlider ? (
            <form onSubmit={handleBannerSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>Banner Title *</span>
                <input
                  name="title"
                  value={bannerForm.title}
                  onChange={handleBannerInputChange}
                  required
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5f5" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>Image URL</span>
                <input
                  name="image_url"
                  value={bannerForm.image_url}
                  onChange={handleBannerInputChange}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>Link URL</span>
                <input
                  name="link_url"
                  value={bannerForm.link_url}
                  onChange={handleBannerInputChange}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>Sort Order</span>
                <input
                  name="sort_order"
                  type="number"
                  value={bannerForm.sort_order}
                  onChange={handleBannerInputChange}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>Status</span>
                <select
                  name="status"
                  value={bannerForm.status ? "true" : "false"}
                  onChange={handleBannerInputChange}
                >
                  <option value="true">Enable</option>
                  <option value="false">Disable</option>
                </select>
              </label>
              {bannerForm.image_url ? (
                <img
                  src={bannerForm.image_url}
                  alt="Banner preview"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
              ) : null}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={isSavingBanner}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#111827",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {isSavingBanner ? "Saving..." : editingBannerId ? "Save Banner" : "Add Banner"}
                </button>
                {editingBannerId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBannerId(null)
                      setBannerForm(emptyBannerForm)
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px solid #cbd5f5",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <p style={{ color: "#94a3b8" }}>Select a slider to manage its banners.</p>
          )}
        </div>
      </section>

      {selectedSlider ? (
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: 0 }}>Banners for {selectedSlider.title}</h2>
          </div>
          {selectedBanners.length ? (
            <div style={{ display: "grid", gap: 16, padding: 20 }}>
              {selectedBanners.map((banner) => (
                <div
                  key={banner.id}
                  style={{
                    border: "1px solid #f1f5f9",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    gap: 16,
                  }}
                >
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      style={{ width: 140, height: 70, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 140,
                        height: 70,
                        borderRadius: 8,
                        border: "1px dashed #cbd5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No Image
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <strong>{banner.title}</strong>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "2px 10px",
                          fontSize: 12,
                          background: banner.status ? "#dcfce7" : "#fee2e2",
                          color: banner.status ? "#166534" : "#b91c1c",
                        }}
                      >
                        {banner.status ? "Enable" : "Disable"}
                      </span>
                    </div>
                    {banner.link_url ? (
                      <div style={{ fontSize: 13, color: "#475569" }}>{banner.link_url}</div>
                    ) : null}
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Sort order: {banner.sort_order}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button
                        style={{
                          marginRight: 8,
                          border: "1px solid #cbd5f5",
                          borderRadius: 4,
                          background: "#fff",
                          cursor: "pointer",
                          padding: "4px 10px",
                        }}
                        onClick={() => handleBannerEdit(banner)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          border: "1px solid #fecdd3",
                          borderRadius: 4,
                          background: "#fff",
                          color: "#b91c1c",
                          cursor: "pointer",
                          padding: "4px 10px",
                        }}
                        onClick={() => handleBannerDelete(banner)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, color: "#94a3b8" }}>No banners added yet.</div>
          )}
        </section>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Banner Sliders",
  parent: "/redington",
})

export default RedingtonBannerSlidersPage
