import { ArtoButtonAria, ArtoButtonBasic, ArtoLintButton } from './component'

function App() {
  return (
    <div className={'p-5 flex gap-5'}>
      <div className={'flex flex-col space-y-2.5'}>
        <code className={'h-8 text-sm text-slate-500'}>ArtoButtonBasic</code>
        <ArtoButtonBasic theme={'primary'} disabled>
          Primary disabled
        </ArtoButtonBasic>
        <ArtoButtonBasic theme={'primary'}>Primary</ArtoButtonBasic>
        <ArtoButtonBasic theme={'primary'} size={'small'}>
          Primary small
        </ArtoButtonBasic>

        <ArtoButtonBasic theme={'secondary'} disabled>
          Secondary disabled
        </ArtoButtonBasic>
        <ArtoButtonBasic theme={'secondary'}>Secondary</ArtoButtonBasic>
        <ArtoButtonBasic theme={'secondary'} size={'small'}>
          Secondary small
        </ArtoButtonBasic>
      </div>

      <div className={'flex flex-col space-y-2.5'}>
        <code className={'h-8 text-sm text-slate-500'}>ArtoButtonAria</code>
        <ArtoButtonAria theme={'primary'} isDisabled>
          Primary disabled
        </ArtoButtonAria>
        <ArtoButtonAria theme={'primary'}>Primary</ArtoButtonAria>
        <ArtoButtonAria theme={'primary'} size={'small'}>
          Primary small
        </ArtoButtonAria>

        <ArtoButtonAria theme={'secondary'} isDisabled>
          Secondary disabled
        </ArtoButtonAria>
        <ArtoButtonAria theme={'secondary'}>Secondary</ArtoButtonAria>
        <ArtoButtonAria theme={'secondary'} size={'small'}>
          Secondary small
        </ArtoButtonAria>
      </div>

      <div className={'flex flex-col space-y-2.5'}>
        <code className={'h-8 text-sm text-slate-500'}>LintButton</code>
        <ArtoLintButton lintConflicts={false}>Linting Button</ArtoLintButton>
      </div>
    </div>
  )
}

export default App
