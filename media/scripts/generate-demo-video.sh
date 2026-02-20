#!/bin/bash

###############################################################################
# Automated Demo Video Generator for Infamous Freight Enterprises
#
# Creates product demonstration videos using ffmpeg and screen recordings.
#
# Usage:
#   ./scripts/generate-demo-video.sh [video-name] [options]
#
# Examples:
#   ./scripts/generate-demo-video.sh product-demo
#   ./scripts/generate-demo-video.sh tutorial-shipment --with-voiceover
###############################################################################

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MEDIA_DIR="${PROJECT_ROOT}/media"
VIDEOS_DIR="${MEDIA_DIR}/videos"
RECORDINGS_DIR="${VIDEOS_DIR}/recordings"
OUTPUT_DIR="${VIDEOS_DIR}/demos"
ASSETS_DIR="${MEDIA_DIR}/branding"

#Create directories
mkdir -p "${RECORDINGS_DIR}"
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${VIDEOS_DIR}/work"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $*"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Check dependencies
check_dependencies() {
    local missing=()
    
    if ! command -v ffmpeg &> /dev/null; then
        missing+=("ffmpeg")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing dependencies: ${missing[*]}"
        info "Install with: brew install ffmpeg"
        exit 1
    fi
}

# Add intro animation (logo reveal)
generate_intro() {
    local output=$1
    local duration=3
    
    log "Generating intro animation..."
    
    # Create intro with logo
    ffmpeg -f lavfi -i color=c=#1E3A8A:s=1920x1080:d=${duration} \
        -i "${ASSETS_DIR}/logo/infamous-freight-logo.svg" \
        -filter_complex "\
            [0:v][1:v]overlay=(W-w)/2:(H-h)/2:enable='between(t,0.5,${duration})',\
            fade=t=in:st=0:d=0.5,\
            fade=t=out:st=$((duration-1)):d=0.5\
        " \
        -c:v libx264 -pix_fmt yuv420p -y "${output}"
    
    log "✅ Intro created: ${output}"
}

# Add outro (call to action)
generate_outro() {
    local output=$1
    local duration=5
    
    log "Generating outro..."
    
    # Create outro with CTA
    ffmpeg -f lavfi -i color=c=#1E3A8A:s=1920x1080:d=${duration} \
        -vf "\
            drawtext=text='Try Infamous Freight Today':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50,\
            drawtext=text='infamousfreight.com':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=40:fontcolor=#F97316:x=(w-text_w)/2:y=(h-text_h)/2+50,\
            fade=t=in:st=0:d=0.5,\
            fade=t=out:st=$((duration-1)):d=0.5\
        " \
        -c:v libx264 -pix_fmt yuv420p -y "${output}"
    
    log "✅ Outro created: ${output}"
}

# Add background music
add_background_music() {
    local video=$1
    local music=$2
    local output=$3
    
    if [ ! -f "${music}" ]; then
        warn "Background music not found: ${music}"
        cp "${video}" "${output}"
        return
    fi
    
    log "Adding background music..."
    
    # Mix video with background music (lowered volume)
    ffmpeg -i "${video}" -i "${music}" \
        -filter_complex "\
            [1:a]volume=0.2,afade=t=in:st=0:d=2,afade=t=out:st=end-2:d=2[music];\
            [0:a][music]amix=inputs=2:duration=first[audio]\
        " \
        -map 0:v -map "[audio]" \
        -c:v copy -c:a aac -b:a 192k \
        -y "${output}"
    
    log "✅ Background music added"
}

# Add voiceover narration
add_voiceover() {
    local video=$1
    local voiceover=$2
    local output=$3
    
    if [ ! -f "${voiceover}" ]; then
        warn "Voiceover file not found: ${voiceover}"
        cp "${video}" "${output}"
        return
    fi
    
    log "Adding voiceover..."
    
    ffmpeg -i "${video}" -i "${voiceover}" \
        -filter_complex "\
            [1:a]volume=1.5[voice];\
            [0:a][voice]amix=inputs=2:duration=first[audio]\
        " \
        -map 0:v -map "[audio]" \
        -c:v copy -c:a aac -b:a 192k \
        -y "${output}"
    
    log "✅ Voiceover added"
}

# Add captions/subtitles
add_captions() {
    local video=$1
    local srt_file=$2
    local output=$3
    
    if [ ! -f "${srt_file}" ]; then
        warn "Subtitle file not found: ${srt_file}"
        cp "${video}" "${output}"
        return
    fi
    
    log "Adding captions..."
    
    ffmpeg -i "${video}" -vf "subtitles=${srt_file}:force_style='Fontsize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'" \
        -c:a copy -c:v libx264 -crf 18 -preset slow \
        -y "${output}"
    
    log "✅ Captions added"
}

# Concatenate video segments
concatenate_videos() {
    local output=$1
    shift
    local segments=("$@")
    
    log "Concatenating video segments..."
    
    # Create concat file
    local concat_file="${VIDEOS_DIR}/work/concat.txt"
    > "${concat_file}"
    for segment in "${segments[@]}"; do
        echo "file '${segment}'" >> "${concat_file}"
    done
    
    # Concatenate
    ffmpeg -f concat -safe 0 -i "${concat_file}" \
        -c copy -y "${output}"
    
    rm "${concat_file}"
    
    log "✅ Videos concatenated"
}

# Compress for web delivery
compress_for_web() {
    local input=$1
    local output=$2
    
    log "Compressing for web..."
    
    ffmpeg -i "${input}" \
        -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 128k \
        -movflags +faststart \
        -y "${output}"
    
    log "✅ Compressed for web"
}

# Create social media versions
create_social_versions() {
    local input=$1
    local basename=$(basename "${input}" .mp4)
    
    log "Creating social media versions..."
    
    # Square version (Instagram)
    ffmpeg -i "${input}" \
        -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 128k \
        -t 60 \
        -y "${OUTPUT_DIR}/${basename}-square.mp4"
    
    # Vertical version (Instagram Stories)
    ffmpeg -i "${input}" \
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 128k \
        -t 15 \
        -y "${OUTPUT_DIR}/${basename}-story.mp4"
    
    log "✅ Social media versions created"
}

# Generate complete demo video
generate_demo_video() {
    local name=$1
    local with_music=${2:-no}
    local with_voiceover=${3:-no}
    local with_captions=${4:-no}
    
    info "Generating demo video: ${name}"
    
    local work_dir="${VIDEOS_DIR}/work"
    local intro="${work_dir}/intro.mp4"
    local outro="${work_dir}/outro.mp4"
    local main_video="${RECORDINGS_DIR}/${name}-recording.mp4"
    local concat_output="${work_dir}/${name}-concat.mp4"
    local final_output="${OUTPUT_DIR}/${name}.mp4"
    
    # Check if main recording exists
    if [ ! -f "${main_video}" ]; then
        error "Main recording not found: ${main_video}"
        info "Please record your screen and save it as: ${main_video}"
        exit 1
    fi
    
    # Generate intro and outro
    generate_intro "${intro}"
    generate_outro "${outro}"
    
    # Concatenate intro + main + outro
    concatenate_videos "${concat_output}" "${intro}" "${main_video}" "${outro}"
    
    # Add background music if requested
    if [ "${with_music}" = "yes" ]; then
        local music_file="${MEDIA_DIR}/audio/background-music.mp3"
        local temp_output="${work_dir}/${name}-with-music.mp4"
        add_background_music "${concat_output}" "${music_file}" "${temp_output}"
        mv "${temp_output}" "${concat_output}"
    fi
    
    # Add voiceover if requested
    if [ "${with_voiceover}" = "yes" ]; then
        local voiceover_file="${MEDIA_DIR}/audio/${name}-voiceover.mp3"
        local temp_output="${work_dir}/${name}-with-voice.mp4"
        add_voiceover "${concat_output}" "${voiceover_file}" "${temp_output}"
        mv "${temp_output}" "${concat_output}"
    fi
    
    # Add captions if requested
    if [ "${with_captions}" = "yes" ]; then
        local srt_file="${MEDIA_DIR}/captions/${name}.srt"
        local temp_output="${work_dir}/${name}-with-captions.mp4"
        add_captions "${concat_output}" "${srt_file}" "${temp_output}"
        mv "${temp_output}" "${concat_output}"
    fi
    
    # Compress for web
    compress_for_web "${concat_output}" "${final_output}"
    
    # Create social media versions
    create_social_versions "${final_output}"
    
    # Clean up work files
    rm -f "${intro}" "${outro}" "${concat_output}"
    
    log "✅ Demo video generated: ${final_output}"
    log "📁 Output directory: 0${OUTPUT_DIR}"
}

# Main function
main() {
    local video_name=${1:-product-demo}
    local with_music=no
    local with_voiceover=no
    local with_captions=no
    
    # Parse options
    shift
    while [ $# -gt 0 ]; do
        case "$1" in
            --with-music)
                with_music=yes
                ;;
            --with-voiceover)
                with_voiceover=yes
                ;;
            --with-captions)
                with_captions=yes
                ;;
            *)
                warn "Unknown option: $1"
                ;;
        esac
        shift
    done
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║    Infamous Freight - Demo Video Generator              ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    info "Video name: ${video_name}"
    info "Background music: ${with_music}"
    info "Voiceover: ${with_voiceover}"
    info "Captions: ${with_captions}"
    
    check_dependencies
    generate_demo_video "${video_name}" "${with_music}" "${with_voiceover}" "${with_captions}"
    
    log "✅ All done!"
}

main "$@"
