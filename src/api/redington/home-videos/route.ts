import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { listHomeVideos } from "../../../lib/pg"
import { sendErrorResponse } from "../utils/respond"

const STATUS_FILTER_KEY = "searchCriteria[filter_groups][0][filters][0][value]"

const normalizeStatus = (value: unknown): boolean | undefined => {
  if (value === null || value === undefined) {
    return undefined
  }
  const normalized = String(value).trim().toLowerCase()
  if (!normalized.length) {
    return undefined
  }
  if (["1", "true", "yes", "active", "enabled"].includes(normalized)) {
    return true
  }
  if (["0", "false", "no", "inactive", "disabled"].includes(normalized)) {
    return false
  }
  return undefined
}

const parseStatusFilter = (query: Record<string, any>) => {
  if (!query) {
    return undefined
  }
  const direct = normalizeStatus(query.status ?? query.value)
  if (direct !== undefined) {
    return direct
  }

  const criteriaValue =
    query[STATUS_FILTER_KEY] || query[STATUS_FILTER_KEY.toLowerCase()]
  return normalizeStatus(criteriaValue)
}

const buildSearchCriteria = (status: boolean | undefined) => {
  if (status === undefined) {
    return { filter_groups: [] }
  }

  return {
    filter_groups: [
      {
        filters: [
          {
            field: "status",
            value: status ? "yes" : "no",
            condition_type: "eq",
          },
        ],
      },
    ],
  }
}

const serializeVideo = (video: Awaited<ReturnType<typeof listHomeVideos>>[number]) => ({
  homevideo_id: video.id,
  title: video.title,
  url: video.url,
  status: video.status ? "yes" : "no",
  created_at: video.created_at,
  updateAt: video.updated_at,
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const statusFilter = parseStatusFilter(req.query || {})
    const videos = await listHomeVideos()
    const filtered =
      statusFilter === undefined
        ? videos
        : videos.filter((video) => video.status === statusFilter)

    return res.json({
      items: filtered.map(serializeVideo),
      total_count: filtered.length,
      search_criteria: buildSearchCriteria(statusFilter),
    })
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load home videos.")
  }
}

