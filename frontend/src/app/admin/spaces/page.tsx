"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Space } from "@/types";
import { AREA_LABELS, STATUS_LABELS } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  X,
} from "lucide-react";

/* ---------- helper ---------- */
const formatRent = (v: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(v);

/* ---------- Space form dialog ---------- */
interface SpaceFormData {
  name: string;
  area: string;
  area_category: string;
  monthly_rent: string;
  yearly_rent: string;
  address: string;
  description: string;
  floor_height: string;
  ground_load: string;
  power_capacity: string;
  has_crane: boolean;
  has_forklift: boolean;
  floor_material: string;
  fire_rating: string;
  drainage: string;
  ventilation: string;
  has_office: boolean;
  parking: string;
  loading_platform: boolean;
  status: string;
  is_published: boolean;
}

const emptyForm: SpaceFormData = {
  name: "",
  area: "",
  area_category: "small",
  monthly_rent: "",
  yearly_rent: "",
  address: "",
  description: "",
  floor_height: "",
  ground_load: "",
  power_capacity: "",
  has_crane: false,
  has_forklift: false,
  floor_material: "",
  fire_rating: "",
  drainage: "",
  ventilation: "",
  has_office: false,
  parking: "",
  loading_platform: false,
  status: "available",
  is_published: false,
};

function SpaceFormDialog({
  open,
  onClose,
  space,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  space?: Space | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<SpaceFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!space;

  useEffect(() => {
    if (space) {
      setForm({
        name: space.name || "",
        area: String(space.area || ""),
        area_category: space.area_category || "small",
        monthly_rent: String(space.monthly_rent || ""),
        yearly_rent: String(space.yearly_rent || ""),
        address: space.address || "",
        description: space.description || "",
        floor_height: space.floor_height != null ? String(space.floor_height) : "",
        ground_load: space.ground_load != null ? String(space.ground_load) : "",
        power_capacity: space.power_capacity != null ? String(space.power_capacity) : "",
        has_crane: space.has_crane || false,
        has_forklift: space.has_forklift || false,
        floor_material: space.floor_material || "",
        fire_rating: space.fire_rating || "",
        drainage: space.drainage || "",
        ventilation: space.ventilation || "",
        has_office: space.has_office || false,
        parking: space.parking || "",
        loading_platform: space.loading_platform || false,
        status: space.status || "available",
        is_published: space.is_published || false,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [space, open]);

  const set = (key: keyof SpaceFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("请填写厂房名称");
      return;
    }

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      area: parseFloat(form.area) || 0,
      area_category: form.area_category,
      monthly_rent: parseFloat(form.monthly_rent) || 0,
      yearly_rent: parseFloat(form.yearly_rent) || 0,
      address: form.address || null,
      description: form.description || null,
      floor_height: form.floor_height ? parseFloat(form.floor_height) : null,
      ground_load: form.ground_load ? parseFloat(form.ground_load) : null,
      power_capacity: form.power_capacity ? parseInt(form.power_capacity) : null,
      has_crane: form.has_crane,
      has_forklift: form.has_forklift,
      floor_material: form.floor_material || null,
      fire_rating: form.fire_rating || null,
      drainage: form.drainage || null,
      ventilation: form.ventilation || null,
      has_office: form.has_office,
      parking: form.parking || null,
      loading_platform: form.loading_platform,
      status: form.status,
      is_published: form.is_published,
    };

    setSubmitting(true);
    try {
      if (isEdit && space) {
        await api.updateSpace(space.id, body);
      } else {
        await api.createSpace(body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
        <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? "编辑厂房" : "新增厂房"}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Basic info */}
            <fieldset className="mb-5">
              <legend className="mb-3 text-sm font-semibold text-slate-700">
                基本信息
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    厂房名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="如：1号印刷车间"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">面积(㎡)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">面积分类</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    value={form.area_category}
                    onChange={(e) => set("area_category", e.target.value)}
                  >
                    <option value="small">小型 (&lt;100㎡)</option>
                    <option value="medium">中型 (100-500㎡)</option>
                    <option value="large">大型 (&gt;500㎡)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">状态</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="available">可租</option>
                    <option value="rented">已出租</option>
                    <option value="maintenance">维护中</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-slate-500">地址</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-slate-500">描述</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    rows={2}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Site params */}
            <fieldset className="mb-5">
              <legend className="mb-3 text-sm font-semibold text-slate-700">
                场地参数
              </legend>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">层高(m)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.floor_height}
                    onChange={(e) => set("floor_height", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">承重(t/㎡)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.ground_load}
                    onChange={(e) => set("ground_load", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">供电(kVA)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.power_capacity}
                    onChange={(e) => set("power_capacity", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">地面材质</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.floor_material}
                    onChange={(e) => set("floor_material", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">消防等级</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.fire_rating}
                    onChange={(e) => set("fire_rating", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">排水</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.drainage}
                    onChange={(e) => set("drainage", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">通风</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.ventilation}
                    onChange={(e) => set("ventilation", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">停车</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.parking}
                    onChange={(e) => set("parking", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Facilities */}
            <fieldset className="mb-5">
              <legend className="mb-3 text-sm font-semibold text-slate-700">
                配套设施
              </legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.has_crane}
                    onChange={(e) => set("has_crane", e.target.checked)}
                    className="accent-teal-700"
                  />
                  行车
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.has_forklift}
                    onChange={(e) => set("has_forklift", e.target.checked)}
                    className="accent-teal-700"
                  />
                  叉车
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.has_office}
                    onChange={(e) => set("has_office", e.target.checked)}
                    className="accent-teal-700"
                  />
                  办公
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.loading_platform}
                    onChange={(e) => set("loading_platform", e.target.checked)}
                    className="accent-teal-700"
                  />
                  装卸平台
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => set("is_published", e.target.checked)}
                    className="accent-teal-700"
                  />
                  上架发布
                </label>
              </div>
            </fieldset>

            {/* Rent */}
            <fieldset className="mb-5">
              <legend className="mb-3 text-sm font-semibold text-slate-700">
                租金
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    月租(元)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.monthly_rent}
                    onChange={(e) => set("monthly_rent", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    年租(元)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.yearly_rent}
                    onChange={(e) => set("yearly_rent", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="mr-1.5 inline-block h-4 w-4 animate-spin" />}
              保存
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Image upload dialog ---------- */
function ImageUploadDialog({
  open,
  onClose,
  spaceId,
  images,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  spaceId: number;
  images: string[];
  onUpdated: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      await api.uploadSpaceImages(spaceId, files);
      onUpdated();
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string) => {
    try {
      await api.removeSpaceImage(spaceId, url);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">图片管理</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Current images */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {images.map((url) => (
              <div key={url} className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  onClick={() => handleRemove(url)}
                  className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {images.length === 0 && (
              <div className="col-span-3 py-4 text-center text-sm text-slate-400">
                暂无图片
              </div>
            )}
          </div>

          {/* Upload */}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-4 text-sm text-slate-500 hover:border-teal-500 hover:text-teal-600">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "上传中..." : "点击上传图片"}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    </>
  );
}

/* ---------- Main page ---------- */
export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageSpaceId, setImageSpaceId] = useState<number>(0);
  const [imageList, setImageList] = useState<string[]>([]);

  const pageSize = 20;

  const loadSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminGetSpaces({
        page: String(page),
        page_size: String(pageSize),
      });
      setSpaces(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  const handleEdit = (space: Space) => {
    setEditingSpace(space);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingSpace(null);
    setFormOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除厂房「${name}」？此操作不可撤销。`)) return;
    try {
      await api.deleteSpace(id);
      loadSpaces();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      await api.togglePublishSpace(id);
      loadSpaces();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleManageImages = (space: Space) => {
    setImageSpaceId(space.id);
    try {
      setImageList(JSON.parse(space.images || "[]"));
    } catch {
      setImageList([]);
    }
    setImageDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">厂房管理</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          新增厂房
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">名称</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">面积</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">分类</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">月租</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">年租</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">上架</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spaces.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      暂无厂房数据
                    </td>
                  </tr>
                ) : (
                  spaces.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.area}㎡</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {AREA_LABELS[s.area_category] || s.area_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatRent(s.monthly_rent)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatRent(s.yearly_rent)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s.status === "available"
                              ? "bg-green-100 text-green-700"
                              : s.status === "rented"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {STATUS_LABELS[s.status] || s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePublish(s.id)}
                          className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                            s.is_published ? "bg-teal-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                              s.is_published ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleManageImages(s)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600"
                            title="管理图片"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(s)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <SpaceFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingSpace(null);
        }}
        space={editingSpace}
        onSaved={loadSpaces}
      />

      <ImageUploadDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        spaceId={imageSpaceId}
        images={imageList}
        onUpdated={() => {
          loadSpaces();
          setImageDialogOpen(false);
        }}
      />
    </div>
  );
}
