import { useState, type ChangeEvent } from 'react'
import Header from '../../shared/components/organisms/Header'
import PageLayout from '../../shared/components/organisms/PageLayout'
import { PAGE_NAME } from '../../shared/constants/navigation'
import { useNavigation } from '../../shared/context/NavigationContext'
import {
  createDataBackup,
  parseDataBackup,
  restoreDataBackup,
  saveDataBackupFile,
  summarizeDataBackup,
  type DataBackup,
  type DataBackupSummary,
} from '../../shared/storage/dataBackup'

type Notice = {
  message: string
  tone: 'error' | 'success'
}

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function BackupSummary({ summary }: { summary: DataBackupSummary }) {
  const items = [
    { label: 'Songs', value: summary.songCount },
    { label: 'Playlists', value: summary.packCount },
    { label: 'Uploaded PDFs', value: summary.pdfCount },
  ]

  return (
    <div className="mt-5 grid grid-cols-3 gap-2" data-testid="backup-summary">
      {items.map(item => (
        <div key={item.label} className="rounded-2xl bg-zinc-100 px-2 py-3 text-center">
          <p className="text-2xl font-bold text-zinc-900">{item.value}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

export default function DataBackupPage() {
  const { loadPage } = useNavigation()
  const [isSaving, setIsSaving] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [pendingBackup, setPendingBackup] = useState<DataBackup | null>(null)
  const [pendingFilename, setPendingFilename] = useState('')

  async function handleSaveBackup() {
    setIsSaving(true)
    setNotice(null)
    try {
      const backup = await createDataBackup()
      const result = await saveDataBackupFile(backup)
      const summary = summarizeDataBackup(backup)
      if (result === 'cancelled') {
        setNotice({ tone: 'success', message: 'Backup cancelled. Your data was not changed.' })
      } else {
        setNotice({
          tone: 'success',
          message: `Backup ready with ${summary.songCount} songs and ${summary.packCount} playlists.`,
        })
      }
    } catch (error) {
      setNotice({ tone: 'error', message: `Could not save the backup. ${String(error)}` })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleChooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) {
      return
    }

    setNotice(null)
    setPendingBackup(null)
    setPendingFilename('')
    try {
      const backup = parseDataBackup(await file.text())
      setPendingBackup(backup)
      setPendingFilename(file.name)
    } catch (error) {
      setNotice({ tone: 'error', message: String(error) })
    } finally {
      input.value = ''
    }
  }

  async function handleRestoreBackup() {
    if (!pendingBackup) {
      return
    }

    setIsRestoring(true)
    setNotice(null)
    try {
      const summary = await restoreDataBackup(pendingBackup)
      setPendingBackup(null)
      setPendingFilename('')
      setNotice({
        tone: 'success',
        message: `Restore complete. ${summary.songCount} songs and ${summary.packCount} playlists are now on this device.`,
      })
    } catch (error) {
      setNotice({ tone: 'error', message: `Nothing was restored. ${String(error)}` })
    } finally {
      setIsRestoring(false)
    }
  }

  const pendingSummary = pendingBackup ? summarizeDataBackup(pendingBackup) : null

  return (
    <PageLayout
      rootClassName="data-backup-page-root bg-[radial-gradient(circle_at_top_left,_#fff1f6_0,_#fff_42%,_#f5f5f5_100%)]"
      rootTestId="data-backup-page"
      header={<Header title="Backup & Restore" backAction={() => loadPage(PAGE_NAME.WELCOME)} />}
      mainClassName="overflow-y-auto"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-10 pt-3 md:px-8 md:pt-8">
        <div className="mb-7 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-pink">Your data, in your hands</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 md:text-5xl">Move your library between devices.</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-zinc-600 md:text-lg">
            One file contains your songs, uploaded PDFs, and playlists. Current game progress is not included.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="relative overflow-hidden rounded-[28px] border border-rose-100 bg-white p-6 shadow-[0_20px_60px_rgba(87,18,48,0.10)] md:p-8">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-pink/10" />
            <p className="relative text-sm font-bold uppercase tracking-[0.16em] text-brand-pink">Step 1</p>
            <h3 className="relative mt-2 text-2xl font-semibold text-zinc-950">Save this device</h3>
            <p className="relative mt-3 min-h-20 leading-6 text-zinc-600">
              Create a dated backup file. On iPhone or iPad, save it to Files, iCloud Drive, or another location from the share sheet.
            </p>
            <button
              type="button"
              data-action="save-backup"
              className="relative mt-6 w-full rounded-2xl bg-brand-pink px-5 py-4 text-base font-bold text-white shadow-lg shadow-brand-pink/20 transition hover:bg-brand-pinkDark active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
              disabled={isSaving || isRestoring}
              onClick={() => void handleSaveBackup()}
            >
              {isSaving ? 'Preparing backup...' : 'Save backup file'}
            </button>
          </section>

          <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 p-6 text-white shadow-[0_20px_60px_rgba(24,24,27,0.18)] md:p-8">
            <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full border-[24px] border-white/5" />
            <p className="relative text-sm font-bold uppercase tracking-[0.16em] text-rose-300">Step 2</p>
            <h3 className="relative mt-2 text-2xl font-semibold">Restore a backup</h3>
            <p className="relative mt-3 min-h-20 leading-6 text-zinc-300">
              Choose a Piano Bingo backup. The file is checked before you are asked to replace anything on this device.
            </p>
            <label className="relative mt-6 block w-full cursor-pointer rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-center text-base font-bold transition hover:bg-white/15" htmlFor="restore-backup-input">
              Choose backup file
            </label>
            <input
              id="restore-backup-input"
              data-testid="restore-backup-input"
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={isSaving || isRestoring}
              onChange={(event) => void handleChooseBackup(event)}
            />
          </section>
        </div>

        {pendingBackup && pendingSummary && (
          <section className="mt-5 rounded-[28px] border-2 border-amber-300 bg-amber-50 p-6 md:p-8" data-testid="restore-confirmation">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-800">Ready to restore</p>
            <h3 className="mt-2 break-all text-xl font-semibold text-zinc-950">{pendingFilename}</h3>
            <p className="mt-1 text-sm text-zinc-600">Created {formatBackupDate(pendingSummary.createdAt)}</p>
            <BackupSummary summary={pendingSummary} />
            <p className="mt-5 rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold leading-6 text-zinc-800">
              This will replace all songs and playlists currently stored on this device. This cannot be undone unless you save a backup first.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-bold text-zinc-700"
                disabled={isRestoring}
                onClick={() => { setPendingBackup(null); setPendingFilename('') }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-action="confirm-restore"
                className="rounded-xl bg-zinc-950 px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60"
                disabled={isRestoring}
                onClick={() => void handleRestoreBackup()}
              >
                {isRestoring ? 'Restoring...' : 'Replace data and restore'}
              </button>
            </div>
          </section>
        )}

        {notice && (
          <div
            role="status"
            data-testid="backup-notice"
            className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-semibold leading-6 ${notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}
          >
            {notice.message}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
