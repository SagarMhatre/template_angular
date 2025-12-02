# Node 20.19 without global Angular CLI (use project-local CLI instead)
FROM node:20.19.0

# Work inside a predictable folder
WORKDIR /workspace

# Default to a shell for interactive use
CMD ["bash"]
