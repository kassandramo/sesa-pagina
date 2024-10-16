import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CitasService } from '../../core/services/citas.service';
import { UserDataService } from '../../core/services/user.service';
import { validacionesCampos } from '../../shared/validacionesCampos';
import { PacientesService } from '../../core/services/pacientes.service';
import { PersonalService } from '../../core/services/personal.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { constantesGlobales } from '../../shared/global.constants';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';


@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    NgSelectModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {
  altaCitaForm: FormGroup;
  busquedaForm: FormGroup;
  estadoShow = false;
  datosCargados: any;
  idelement: number = 0;
  rol: string = '';
  matricula: number = 0;
  listacita: any[] = [];
  listaPersonal: any[] = [];
  listaPaciente: any[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  columnas: string[] = ['idCita', 'paciente', 'fecha', 'hora', 'tipocita', 'estado', 'atiende', 'acciones'];

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  userData: any;

  constructor(
    private userDataService: UserDataService,
    private citasService: CitasService,
    private pacientesService: PacientesService,
    private personalService: PersonalService,
    private fb: FormBuilder,
  ) {

    this.busquedaForm = this.fb.group({
      search: ['']
    });

    this.altaCitaForm = this.fb.group({
      fecha_cita: ['', Validators.required],
      hora_cita: ['', Validators.required],
      personal: ['0'],
      paciente: ['0'],
      tipo: ['0'],
      estado: ['0'],
    });

    this.busquedaForm.get('search')?.valueChanges.subscribe(value => {
      if (value === null || value === undefined || value === '') {
        this.buscar();
      }

    });
  }

  ngOnInit(): void {
    this.userData = this.userDataService.getUserData();
    console.log("entrando en el componente pacientes");
    this.cargaCitas();
    this.cargaListaPersonal();
    this.cargaListaPacientes();
    this.cargaFiltros();

    // Si el usuario tiene los roles 1 o 3, establece el filtro inicial
    if (this.userData && (this.userData.ID_ROL === 1 || this.userData.ID_ROL === 3)) {
      this.dataSource.filter = this.userData.MATRICULA.toString();
    }
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }


  cargaCitas(): void {
    this.citasService.obtenerCitas().subscribe({
      next: data => {
        console.log('Respuesta del API:', data);
        this.listacita = data;
        this.dataSource.data = this.listacita;
      },
      error: error => console.error('Error al obtener la lista de citas:', error)
    });
  }

  cargaListaPersonal(): void {
    this.personalService.obtenerPersonal().subscribe({
      next: (data) => {
        // Filtrar solo los elementos que tienen CVE_ESTADO distinto de 2
        this.listaPersonal = data.filter((personal: { CVE_ESTADO: number; }) => personal.CVE_ESTADO !== 2);
        console.log('Lista de personal cargada:', this.listaPersonal); // Agrega un log si quieres revisar la lista filtrada
      },
      error: (error) => {
        console.error('Error al obtener la lista de personal:', error);
        // Puedes mostrar un mensaje de error en la UI si lo deseas
        this.mensajeError = 'Ocurrió un error al cargar la lista de personal. Intenta nuevamente más tarde.';
      }
    });
  }

  cargaFiltros(): void {
    // Configura el filtro para que funcione en múltiples campos
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const transformedFilter = filter.trim().toLowerCase();

      // Busca en todos los campos relevantes
      const matchId = data.ID_CITA.toString().includes(transformedFilter);
      const matchNombreP = data.paciente.NOMBRE.toLowerCase().includes(transformedFilter);
      const matchNombre = data.personal.NOMBRE.toLowerCase().includes(transformedFilter);
      const matchMatricula = data.MATRICULAMED.toString().includes(transformedFilter);

      // Retorna true si el filtro coincide con alguno de los campos
      return matchId || matchNombre || matchNombreP || matchMatricula;
    };
  }

  // Función para aplicar el filtro
  buscar() {
    const criterio = this.busquedaForm.get('search')?.value || ''; // Asegúrate de que no sea null
    this.dataSource.filter = criterio.trim().toLowerCase(); // Aplica el primer filtro en minúsculas

    // Aplicar el segundo filtro basado en la matrícula si el usuario tiene roles 1 o 3
    if (this.userData && (this.userData.ID_ROL === 1 || this.userData.ID_ROL === 3)) {
      const filtradoPorMatricula = this.dataSource.data.filter(
        cita => cita.MATRICULAMED === this.userData.MATRICULA
      );
      this.dataSource.data = filtradoPorMatricula; // Actualizar los datos con el resultado filtrado
    }

    // Ver el resultado final después de ambos filtros
    console.log('Resultado de la búsqueda:', this.dataSource.data);
  }

  cargaListaPacientes(): void {
    this.pacientesService.obtenerPacientes().subscribe({
      next: (data) => {
        // Filtrar solo los elementos que están activos (ACTIVO === true) y tienen seguro (CVE_SEGURO === true)
        this.listaPaciente = data.filter(
          (paciente: { ACTIVO: boolean; CVE_SEGURO: boolean }) =>
            paciente.ACTIVO === true && paciente.CVE_SEGURO === true
        );
        console.log('Lista de pacientes cargada:', this.listaPaciente); // Agrega un log si quieres revisar la lista filtrada
      },
      error: (error) => {
        console.error('Error al obtener la lista de pacientes:', error);
        // Puedes mostrar un mensaje de error en la UI si lo deseas
        this.mensajeError = 'Ocurrió un error al cargar la lista de pacientes. Intenta nuevamente más tarde.';
      }
    });
  }

  registrarCita(): void {
    if (this.altaCitaForm.valid) {
      this.mensajeExito = "";
      this.mensajeError = "";
      const fechaActual = new Date();
      const nuevaFechaCaducidad = new Date(fechaActual);
      nuevaFechaCaducidad.setDate(nuevaFechaCaducidad.getDate() + 30);

      // Preparar el JSON con los datos del formulario
      const dataPersonal = {
        FECHA_CITA: this.altaCitaForm.get('fecha_cita')?.value,
        HORA_CITA: this.altaCitaForm.get('hora_cita')?.value,
        CVE_TIPO_CITA: this.altaCitaForm.get('tipo')?.value,
        ID_PACIENTE: this.altaCitaForm.get('paciente')?.value,
        MATRICULAMED: this.altaCitaForm.get('personal')?.value,
        CVE_ESTADO: 1,
        ACTIVO: true,
      };
      console.log('Formulario enviado con éxito:', dataPersonal);

      // Llamar al servicio para registrar el horario
      this.citasService.crearCita(dataPersonal).subscribe({
        next: (response) => {
          console.log('Personal dado de alta con éxito:', response);
          this.mensajeExito = 'Personal registrado con éxito';
          this.mensajeError = '';

          // Limpiar el formulario
          this.limpiarFormulario();

          // Actualizar la lista de pacientes
          this.cargaCitas();
        },
        error: (error) => {
          console.error('Error en el alta del personal:', error);
          this.mensajeError = 'Ocurrió un error al dar de alta al personal, por favor intente de nuevo.';
          this.mensajeExito = '';
        }
      });
    } else {
      this.validarFormulario();
    }
  }

  eliminar(element: any): void {
    // Cambiar el estado del elemento localmente
    const nuevoEstado = { ACTIVO: false, CVE_ESTADO: 6 };

    console.log('eliminar a:', this.idelement);

    // Llamar al servicio para actualizar el estado en la base de datos
    this.citasService.actualizarCita(this.idelement, nuevoEstado).subscribe({
      next: (respuesta) => {
        console.log('Estado de la cita actualizado correctamente:', respuesta);

        // Actualizar la tabla para reflejar los cambios
        this.cargaCitas();
      },
      error: (error) => {
        console.error('Error al actualizar los datos de la cita:', error);
        // Manejar el error (mostrar un mensaje o algo similar)
      }
    });
  }

  cargarDatos(element: any): void {
    console.log(element)
    this.idelement = element.ID_CITA
    this.altaCitaForm.setValue({
      fecha_cita: element.FECHA_CITA,
      hora_cita: element.HORA_CITA,
      personal: element.MATRICULAMED,
      paciente: element.ID_PACIENTE,
      tipo: element.CVE_TIPO_CITA,
      estado: element.CVE_ESTADO,
    });
    console.log(element.CVE_ESTADO)
    this.estadoShow = element.CVE_ESTADO !== 6;
    console.log(this.estadoShow);
    this.datosCargados = this.altaCitaForm.value;
  }

  actualizarRegistro(): void {
    this.mensajeExito = "";
    this.mensajeError = "";
    if (this.altaCitaForm.valid) {
      if (this.datosCargados === this.altaCitaForm.value) {
        this.mensajeError = constantesGlobales.ERROR_SIN_CAMBIO
      } else {

        // Preparar el JSON con los datos del formulario
        const dataPersonal = {
          FECHA_CITA: this.altaCitaForm.get('fecha_cita')?.value,
          HORA_CITA: this.altaCitaForm.get('hora_cita')?.value,
          CVE_TIPO_CITA: this.altaCitaForm.get('tipo')?.value,
          ID_PACIENTE: this.altaCitaForm.get('paciente')?.value,
          MATRICULAMED: this.altaCitaForm.get('personal')?.value,
          CVE_ESTADO: this.altaCitaForm.get('estado')?.value,
          ACTIVO: true,
        };
        console.log('Formulario enviado con éxito:', dataPersonal);
        console.log(this.idelement);

        // Llamar al servicio para registrar el horario
        this.citasService.actualizarCita(this.idelement, dataPersonal).subscribe({
          next: (response) => {
            console.log('cita actualizada con éxito:', response);
            this.mensajeExito = 'Cita actualizada con éxito';
            this.mensajeError = '';

            // Actualizar la lista de pacientes
            this.cargaCitas();
          },
          error: (error) => {
            if (error.message === constantesGlobales.ERROR_CITA_SIN_CAMBIO) {
              console.log(constantesGlobales.ERROR_SIN_CAMBIO);
              this.mensajeError = constantesGlobales.ERROR_SIN_CAMBIO
            } else {
              console.error('Ocurrió un error al actualizar los datos del personal:', error);
              this.mensajeError = `Ocurrió un error al actualizar el personal: ${error}`;
            }
          }

        });
      }
    } else {
      this.validarFormulario();
    }
  }

  validarFormulario(): void {
    const validaciones = validacionesCampos(this.altaCitaForm);
    this.mensajeError = validaciones.mensajeError;
    this.mensajeExito = validaciones.mensajeExito;
  }

  limpiarFormulario(): void {
    this.altaCitaForm.reset();
    if (this.userData) {
      if (this.userData.ID_ROL === 1 || this.userData.ID_ROL === 3) {
        // Establecer el valor por defecto
        this.dataSource.filter = this.userData.MATRICULA.toString();
        this.altaCitaForm.patchValue({
          personal: this.userData.MATRICULA,
          paciente: 0,
          tipo: 0
        });

        // Deshabilitar el campo
        this.altaCitaForm.get('personal')?.disable();
      } else {
        this.altaCitaForm.patchValue({
          personal: 0,
          paciente: 0,
          tipo: 0
        });
      }
    }
  }

  actualizarTabla(): void {
    // Filtrar los horarios que estén activos
    this.listacita = this.listacita
      .sort((a, b) => {
        // Ordenar por FECHA_CITA en orden descendente
        return new Date(b.FECHA_CITA).getTime() - new Date(a.FECHA_CITA).getTime();
      });
  }

  tiposAgenda = [
    { value: 1, label: 'Peso y Talla' },
    { value: 2, label: 'Control Embarazos' },
    { value: 3, label: 'Control Mensual' },
    { value: 4, label: 'Diagnóstico' },
    { value: 5, label: 'Dentista' },
    { value: 6, label: 'Otro' }
  ];

  estadosCita = [
    { value: 1, label: 'Pendiente' },
    { value: 2, label: 'En Atención' },
    { value: 3, label: 'Atendido' },
    { value: 4, label: 'Atrasado' },
    { value: 5, label: 'Pospuesto' },
    { value: 6, label: 'Cancelado' },
    { value: 7, label: 'Reprogramado' }
  ];

  getTipoCita(CVE_TIPO_CITA: number): string {
    const estados: { [key: number]: string } = {
      1: 'Peso y Talla',
      2: 'control Embarazos',
      3: 'Control Mensual',
      4: 'Diagnóstico',
      5: 'Dentista',
      6: 'Otro',
    };
    return estados[CVE_TIPO_CITA] || 'Desconocido';
  }
  getEstadoCita(CVE_TIPO_CITA: number): string {
    const estados: { [key: number]: string } = {
      1: 'Pendiente',
      2: 'En Atención',
      3: 'Atendido',
      4: 'Atrasado',
      5: 'Pospuesto',
      6: 'Cancelado',
      7: 'Reprogramado',
    };
    return estados[CVE_TIPO_CITA] || 'Estado Desconocido';
  }


}
