import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../../hooks/use-toast'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

export default function HRImportEmployees() {
  const { importUsersFromCsv } = useData()
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogDescription, setDialogDescription] = useState('')
  const [dialogVariant, setDialogVariant] = useState<'success' | 'error'>('success')
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleFileSelected = (file: File) => {
    if (!file) return
    setSelectedFile(file)
  }

  const handleCsvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFileSelected(file)
    e.target.value = ''
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  const handleUploadClick = async () => {
    if (!selectedFile) return

    setImporting(true)
    try {
      const result = await importUsersFromCsv(selectedFile)

      const t = toast({
        title: 'Import CSV réussi',
        description: `${result.createdCount} utilisateurs créés, ${result.errorCount} lignes en erreur`,
      })

      setTimeout(() => {
        t.dismiss()
      }, 2500)

      setDialogVariant('success')
      setDialogTitle('Import terminé avec succès')
      setDialogDescription(
        `${result.createdCount} utilisateurs ont été créés. ${result.errorCount} ligne(s) n'ont pas pu être importées.`,
      )
      setDialogOpen(true)
      setTimeout(() => setDialogOpen(false), 1000)
      setStatusBanner({
        type: 'success',
        message: `Import terminé : ${result.createdCount} utilisateurs créés, ${result.errorCount} ligne(s) en erreur.`,
      })

      setSelectedFile(null)
    } catch (err: any) {
      const message = err?.message ?? "Impossible d'importer le fichier CSV des employés"
      const t = toast({
        title: 'Erreur lors de l’import CSV',
        description: message,
      })
      setTimeout(() => {
        t.dismiss()
      }, 3000)

      setDialogVariant('error')
      setDialogTitle('Erreur lors de l’import CSV')
      setDialogDescription(message)
      setDialogOpen(true)
      setTimeout(() => setDialogOpen(false), 1000)
      setStatusBanner({
        type: 'error',
        message,
      })
    } finally {
      setImporting(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-80px)] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Import des employés (CSV)</h1>
          <p className="text-sm text-muted-foreground">
            Glissez-déposez un fichier CSV ou sélectionnez-le pour créer plusieurs comptes employés automatiquement.
          </p>

          {statusBanner && (
            <div
              className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                statusBanner.type === 'success'
                  ? 'border-emerald-300/60 bg-emerald-50 text-emerald-800'
                  : 'border-red-300/60 bg-red-50 text-red-800'
              }`}
            >
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>{statusBanner.message}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div
            className={`flex flex-1 flex-col gap-4 rounded-xl border border-dashed px-6 py-8 transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border bg-card/60'
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold text-foreground">
                  {selectedFile
                    ? selectedFile.name
                    : 'Glissez-déposez un fichier CSV des employés dans cette zone'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedFile
                    ? 'Fichier prêt à être importé'
                    : 'ou cliquez sur « Choisir un fichier » pour sélectionner un .csv depuis votre poste'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  disabled={importing}
                >
                  Choisir un fichier
                </button>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={!selectedFile || importing}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {importing ? 'Upload en cours...' : 'Uploader'}
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                    disabled={importing}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Format attendu du CSV :</p>
              <p>Colonnes minimales : <code>name, matricule, telephone, email, date_embauche</code></p>
              <p>Colonnes optionnelles : <code>role, status, department_id, manager_id, password</code></p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvChange}
            disabled={importing}
          />
        </div>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  dialogVariant === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {dialogVariant === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="mt-2 w-full sm:mt-0 sm:w-auto"
              onClick={() => setDialogOpen(false)}
            >
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

