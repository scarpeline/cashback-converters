import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Maximize2, Download } from "lucide-react";

const VideoDemo = ({ 
  videoSrc = "/api/placeholder/video/demo.mp4",
  thumbnailSrc = "/api/placeholder/800/450",
  title = "Veja o Salão CashBack em Ação",
  description = "Descubra como nossa plataforma pode transformar sua barbearia"
}: {
  videoSrc?: string;
  thumbnailSrc?: string;
  title?: string;
  description?: string;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    
    video.currentTime = (newProgress / 100) * video.duration;
    setProgress(newProgress);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).mozRequestFullScreen) {
      (video as any).mozRequestFullScreen();
    }
  };

  return (
    <div className="relative group">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-white/20 overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          {/* Video Container */}
          <div 
            className="relative aspect-video bg-black"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={videoSrc}
              poster={thumbnailSrc}
              onClick={togglePlay}
            />

            {/* Play Button Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button
                  size="lg"
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transform hover:scale-110 transition-all duration-300"
                >
                  <Play className="w-8 h-8 ml-1" />
                </Button>
              </div>
            )}

            {/* Video Controls */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
              showControls || isPlaying ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* Progress Bar */}
              <div 
                ref={progressBarRef}
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFullscreen}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-2"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Video Info Badge */}
            <div className="absolute top-4 left-4">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  Demonstração • 3:45
                </span>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-300 mb-4">
              {description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-white text-sm">HD</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <span className="text-white text-sm">Português</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <span className="text-white text-sm">Legendas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white mb-1">15K+</div>
            <div className="text-gray-400 text-sm">Visualizações</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white mb-1">98%</div>
            <div className="text-gray-400 text-sm">Aprovação</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white mb-1">3:45</div>
            <div className="text-gray-400 text-sm">Duração</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoDemo;
