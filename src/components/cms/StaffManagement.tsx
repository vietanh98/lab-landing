import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface StaffManagementProps {
  staff: any[];
  onEditStaff: (member: any) => void;
  onDeleteStaff: (id: string) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ staff, onEditStaff, onDeleteStaff }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Nhân viên</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                      {(s.name || s.full_name || s.username || s.email || '?').charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900">
                      {s.name || s.full_name || s.username || s.email || 'Không rõ tên'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.username || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.email || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.phone || '—'}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const roleName =
                      (Array.isArray(s.roles) && s.roles.length > 0
                        ? s.roles.map((r: any) => r.description || r.name || r.role_name).join(', ')
                        : s.role_name || s.role || '—');
                    return <span className="text-sm text-slate-600 font-medium">{roleName}</span>;
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {s.created_at
                    ? new Date(s.created_at).toLocaleString('vi-VN')
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const numericStatus = Number(s.status);
                    const isActive = numericStatus === 2;
                    const statusText =
                      numericStatus === 1
                        ? 'Không hoạt động'
                        : numericStatus === 2
                        ? 'Hoạt động'
                        : 'Không rõ';
                    return (
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-sm text-slate-600">{statusText}</span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => onEditStaff(s)}
                      className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg" title="Sửa nhân viên"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => onDeleteStaff(s.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg" title="Xóa nhân viên"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagement;
