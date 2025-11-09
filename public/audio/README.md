# Arquivos de Áudio para Sistema de Aquecimento

Para o funcionamento completo do sistema de aquecimento, você deve colocar os seguintes arquivos MP3 nesta pasta:

## Arquivos Necessários:

### 1. `warmup-start.mp3`
- **Duração**: 3 segundos
- **Conteúdo**: Áudio falando "ATENÇÃO PARA O AQUECIMENTO"
- **Formato**: MP3
- **Quando toca**: Ao clicar em "Iniciar Aquecimento"

### 2. `warmup-music-1min.mp3`
- **Duração**: 1 minuto
- **Conteúdo**: Música de aquecimento para sessão de 1 minuto
- **Formato**: MP3
- **Quando toca**: Durante aquecimento de 1 minuto (após o áudio de início)

### 3. `warmup-music-4min.mp3`
- **Duração**: 4 minutos
- **Conteúdo**: Música de aquecimento para sessão de 4 minutos
- **Formato**: MP3
- **Quando toca**: Durante aquecimento de 4 minutos (após o áudio de início)

### 4. `warmup-end.mp3`
- **Duração**: 2-3 segundos
- **Conteúdo**: Áudio falando "FIM DE AQUECIMENTO"
- **Formato**: MP3
- **Quando toca**: Ao finalizar o tempo ou clicar em "Parar"

## Sequência de Funcionamento:

1. **Usuário clica "Iniciar Aquecimento"**
   → Toca `warmup-start.mp3` (3 segundos)
   
2. **Após 3 segundos**
   → Toca `warmup-music-1min.mp3` ou `warmup-music-4min.mp3` (dependendo da seleção)
   
3. **Ao finalizar o tempo ou clicar "Parar"**
   → Para a música e toca `warmup-end.mp3`

## Instruções:

1. Grave ou obtenha os 4 arquivos MP3 conforme especificado acima
2. Coloque todos os arquivos nesta pasta (`public/audio/`)
3. Certifique-se de que os nomes dos arquivos estejam exatamente como listado
4. Teste o sistema de aquecimento no control.html

**Nota**: Os arquivos devem estar em formato MP3 para compatibilidade máxima com navegadores.
