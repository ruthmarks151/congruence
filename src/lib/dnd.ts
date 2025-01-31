type DraggableParams = string;

export function draggable(node: HTMLElement, data: DraggableParams) {
	let state: DraggableParams = data;

	node.draggable = true;
	node.style.cursor = 'grab';

	function handle_dragstart(e: DragEvent) {
		if (!e.dataTransfer) return;
		e.dataTransfer.setData('text/plain', state);
	}

	node.addEventListener('dragstart', handle_dragstart);

	return {
		update(data: DraggableParams) {
			state = data;
		},

		destroy() {
			node.removeEventListener('dragstart', handle_dragstart);
		}
	};
}

interface DropzoneProps {
	dropEffect: DataTransfer['dropEffect'];
	dragover_class: string;
	on_dropzone?: (data: string, e: DragEvent) => void;
}

export function dropzone(node: HTMLElement, options: Partial<DropzoneProps>) {
	const dropzoneClass = 'dropzone';
	node.classList.add(dropzoneClass);
	let depth = 0;
	let state: DropzoneProps = {
		dropEffect: 'move',
		dragover_class: 'droppable',
		...options
	};

	function handle_dragenter(e: DragEvent) {
		if (!(e.target instanceof HTMLElement)) return;
		if (e.target.classList.contains(dropzoneClass)) {
			e.target.classList.add(state.dragover_class);
			depth = 0;
		} else {
			depth++;
		}
	}

	function handle_dragleave(e: DragEvent) {
		if (!(e.target instanceof HTMLElement)) return;
		if (depth == 0) {
			e.target.classList.remove(state.dragover_class);
		} else {
			depth--;
		}
	}

	function handle_dragover(e: DragEvent) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = state.dropEffect;
	}

	function handle_drop(e: DragEvent) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		const data = e.dataTransfer.getData('text/plain');
		if (!(e.target instanceof HTMLElement)) return;
		depth = 0;
		e.target.classList.remove(state.dragover_class);
		state.on_dropzone?.(data, e);
	}

	node.addEventListener('dragenter', handle_dragenter);
	node.addEventListener('dragleave', handle_dragleave);
	node.addEventListener('dragover', handle_dragover);
	node.addEventListener('drop', handle_drop);

	return {
		update(options: Partial<DropzoneProps>) {
			state = {
				dropEffect: 'move',
				dragover_class: 'droppable',
				...options
			};
		},

		destroy() {
			node.classList.remove(dropzoneClass);
			node.classList.remove(state.dragover_class);
			node.removeEventListener('dragenter', handle_dragenter);
			node.removeEventListener('dragleave', handle_dragleave);
			node.removeEventListener('dragover', handle_dragover);
			node.removeEventListener('drop', handle_drop);
		}
	};
}
