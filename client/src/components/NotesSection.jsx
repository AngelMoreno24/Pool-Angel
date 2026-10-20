import { useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from '../hooks/useAppQueries';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Spinner from './Spinner';

const NotesSection = ({ attachmentField, attachmentId, title = 'Notes' }) => {
  const { role } = UserAuth();
  const notesQuery = useNotes(role);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();
  const [body, setBody] = useState('');
  const [ownerOnly, setOwnerOnly] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ body: '', ownerOnly: false, pinned: false });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const isOwner = role === 'OWNER';
  const notes = (notesQuery.data || [])
    .filter((note) => note[attachmentField] === attachmentId)
    .sort((left, right) => Number(right.pinned) - Number(left.pinned));

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setActionError('');
    try {
      await createMutation.mutateAsync({
        body: body.trim(),
        ownerOnly,
        pinned,
        [attachmentField]: attachmentId,
      });
      setBody('');
      setOwnerOnly(false);
      setPinned(false);
    } catch (error) {
      setActionError(error?.response?.data?.error || 'Could not add this note. Please try again.');
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditDraft({ body: note.body, ownerOnly: note.ownerOnly, pinned: note.pinned });
    setActionError('');
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editDraft.body.trim()) return;
    setActionError('');
    try {
      await updateMutation.mutateAsync({ id: editingId, data: { ...editDraft, body: editDraft.body.trim() } });
      setEditingId(null);
    } catch (error) {
      setActionError(error?.response?.data?.error || 'Could not update this note. Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setActionError('');
    } catch (error) {
      setActionError(error?.response?.data?.error || 'Could not delete this note. Please try again.');
      setDeleteTarget(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          {title} {!notesQuery.isLoading && <span className="font-normal text-slate-400">({notes.length})</span>}
        </h2>
      </div>

      {notesQuery.isLoading ? (
        <div className="px-5 py-6 text-sm text-slate-500">Loading notes...</div>
      ) : notesQuery.isError ? (
        <div className="px-5 py-6 text-sm text-red-600">Couldn't load notes. Refresh to try again.</div>
      ) : notes.length === 0 ? (
        <div className="px-5 py-6 text-sm text-slate-500">No notes yet.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notes.map((note) => (
            <li key={note.id} className="px-5 py-4">
              {editingId === note.id ? (
                <form onSubmit={saveEdit} className="space-y-3">
                  <textarea
                    aria-label="Edit note"
                    value={editDraft.body}
                    onChange={(event) => setEditDraft((current) => ({ ...current, body: event.target.value }))}
                    maxLength={5000}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={editDraft.pinned} onChange={(event) => setEditDraft((current) => ({ ...current, pinned: event.target.checked }))} />
                      Pinned
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={editDraft.ownerOnly} onChange={(event) => setEditDraft((current) => ({ ...current, ownerOnly: event.target.checked }))} />
                      Owner only
                    </label>
                    <span className="ml-auto flex gap-2">
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={updateMutation.isPending || !editDraft.body.trim()} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                        {updateMutation.isPending && <Spinner />} Save
                      </button>
                    </span>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-800">{note.body}</p>
                    {isOwner && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => startEditing(note)} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">Edit</button>
                        <button type="button" onClick={() => setDeleteTarget(note)} className="text-xs font-medium text-red-600 hover:text-red-500">Delete</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{note.author ? `${note.author.firstName || ''} ${note.author.lastName || ''}`.trim() || 'Team member' : 'Former team member'}</span>
                    <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time>
                    {note.pinned && <span className="font-medium text-amber-700">Pinned</span>}
                    {note.ownerOnly && <span className="font-medium text-slate-600">Owner only</span>}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {actionError && <p role="alert" className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{actionError}</p>}

      {isOwner && (
        <form onSubmit={handleCreate} className="space-y-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <label htmlFor={`note-${attachmentField}-${attachmentId}`} className="block text-sm font-medium text-slate-800">Add a note</label>
          <textarea
            id={`note-${attachmentField}-${attachmentId}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Write a note..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
              Pin note
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={ownerOnly} onChange={(event) => setOwnerOnly(event.target.checked)} />
              Owner only
            </label>
            <button type="submit" disabled={createMutation.isPending || !body.trim()} className="ml-auto inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
              {createMutation.isPending && <Spinner />} Add note
            </button>
          </div>
        </form>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete this note?"
          message="This note will be permanently removed."
          confirmLabel="Delete note"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
};

export default NotesSection;